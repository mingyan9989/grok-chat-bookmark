const NATIVE_HOST_NAME = 'com.grok.bookmark_writer';

const DEFAULT_SETTINGS = {
  provider: 'local-claude',
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  apiKey: '',
  apiModel: 'gpt-4o-mini',
  folderName: 'grok bookmark',
  baseFolderPath: '',
  useDownloadFallback: true
};

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS));
  const next = { ...DEFAULT_SETTINGS, ...current };
  await chrome.storage.sync.set(next);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  routeMessage(message)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));

  return true;
});

async function routeMessage(message) {
  switch (message?.type) {
    case 'PICK_FOLDER':
      return pickAndSaveFolder();
    case 'EXPORT_CURRENT_GROK_CHAT':
      return exportCurrentGrokChat();
    default:
      throw new Error('Unknown message type.');
  }
}

async function pickAndSaveFolder() {
  const picked = await sendNativeMessage({ action: 'pick_folder' });

  if (!picked?.success || !picked.path) {
    throw new Error(picked?.error === 'cancelled' ? '你取消了文件夹选择。' : picked?.error || '选择文件夹失败。');
  }

  await chrome.storage.sync.set({ baseFolderPath: picked.path });
  return { baseFolderPath: picked.path };
}

async function exportCurrentGrokChat() {
  const settings = await loadSettings();
  const tab = await getActiveTab();

  if (!tab?.id || !tab.url || !/^https:\/\/grok\.com\//.test(tab.url)) {
    throw new Error('请先打开 Grok 对话页面（https://grok.com/...）。');
  }

  const extraction = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_GROK_CHAT' });
  if (!extraction?.ok || !extraction?.chat) {
    throw new Error(extraction?.error || '无法读取当前对话内容。');
  }

  const chat = extraction.chat;
  const originalConversation = renderOriginalConversation(chat);
  const tldr = await generateStructuredTldr(chat, settings);
  const finalMarkdown = renderExportMarkdown({ chat, tldr, originalConversation, provider: settings.provider });
  const filename = buildFilename(chat.title || 'grok-chat');

  const target = await ensureTargetPath(settings);
  if (target.baseFolderPath) {
    try {
      const saved = await writeViaNativeHost(target.baseFolderPath, target.folderName, filename, finalMarkdown);
      return {
        method: 'native',
        filePath: saved.path,
        filename
      };
    } catch (error) {
      if (!settings.useDownloadFallback) {
        throw error;
      }
    }
  }

  await downloadMarkdown(finalMarkdown, settings.folderName, filename);
  return {
    method: 'download',
    filename
  };
}

async function loadSettings() {
  const loaded = await chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS));
  return {
    ...DEFAULT_SETTINGS,
    ...loaded
  };
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
}

function renderOriginalConversation(chat) {
  const lines = [];

  chat.messages.forEach((message, index) => {
    const role = message.role === 'assistant' ? 'Grok' : 'User';
    lines.push(`### ${index + 1}. ${role}`);
    lines.push('');
    lines.push(message.text || '');
    lines.push('');
  });

  return lines.join('\n').trim();
}

function renderExportMarkdown({ chat, tldr, originalConversation, provider }) {
  const lines = [];

  lines.push(`# ${chat.title || 'Grok Chat'}`);
  lines.push('');
  lines.push(`> **Source**: ${chat.url || 'unknown'}`);
  lines.push(`> **Exported At**: ${new Date().toISOString()}`);
  lines.push(`> **Mode**: ${provider === 'no-ai' ? 'Original' : 'AI TLDR'}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  if (tldr) {
    lines.push('## TLDR');
    lines.push('');
    lines.push(tldr.trim());
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  lines.push('## Original Conversation');
  lines.push('');
  lines.push(originalConversation || '_No content extracted._');
  lines.push('');

  return lines.join('\n').trim() + '\n';
}

async function generateStructuredTldr(chat, settings) {
  if (settings.provider === 'no-ai') {
    return null;
  }

  const fallback = buildFallbackTldr(chat);

  try {
    if (settings.provider === 'local-claude') {
      const tldr = await runLocalClaudeSummary(chat);
      return normalizeSummary(tldr) || fallback;
    }

    if (settings.provider === 'custom-api') {
      const tldr = await runCustomApiSummary(chat, settings);
      return normalizeSummary(tldr) || fallback;
    }

    return fallback;
  } catch (error) {
    return fallback;
  }
}

async function runLocalClaudeSummary(chat) {
  const system = [
    'You are an expert conversation analyst.',
    'Generate a structured TLDR in markdown.',
    'Keep facts faithful to the conversation only.',
    'Always include a Fact Check score from 1 to 10.',
    'Return markdown only, no preface.'
  ].join(' ');

  const user = [
    'Analyze this Grok conversation and output markdown with exactly these sections:',
    '### Key Points',
    '- bullet list',
    '### Step-by-Step',
    '1. numbered steps',
    '### Fact Check',
    '- Score: X/10',
    '- Rationale: ...',
    '### Open Questions',
    '- bullet list',
    '',
    `Conversation Title: ${chat.title || 'Grok Chat'}`,
    `Conversation URL: ${chat.url || 'unknown'}`,
    '',
    renderOriginalConversation(chat)
  ].join('\n');

  const result = await sendNativeMessage({
    action: 'call_claude',
    system,
    user
  });

  if (!result?.success || !result.text || !result.text.trim()) {
    throw new Error(result?.error || 'Local Claude summarization failed.');
  }

  return result.text.trim();
}

async function runCustomApiSummary(chat, settings) {
  if (!settings.apiEndpoint) {
    throw new Error('Custom API 模式需要 API Endpoint。');
  }

  const headers = {
    'Content-Type': 'application/json'
  };

  if (settings.apiKey) {
    headers.Authorization = `Bearer ${settings.apiKey}`;
  }

  const body = {
    model: settings.apiModel || DEFAULT_SETTINGS.apiModel,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert conversation analyst. Return markdown only. Include sections: Key Points, Step-by-Step, Fact Check with Score X/10, and Open Questions.'
      },
      {
        role: 'user',
        content: [
          `Conversation Title: ${chat.title || 'Grok Chat'}`,
          `Conversation URL: ${chat.url || 'unknown'}`,
          'Please generate structured TLDR with fact check score 1-10.',
          '',
          renderOriginalConversation(chat)
        ].join('\n')
      }
    ]
  };

  const response = await fetch(settings.apiEndpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Custom API 请求失败: ${response.status}`);
  }

  const data = await response.json();
  const text =
    data?.choices?.[0]?.message?.content ||
    data?.output_text ||
    data?.markdown ||
    data?.output;

  if (typeof text === 'string' && text.trim()) {
    return text.trim();
  }

  throw new Error('Custom API returned empty summary.');
}

function normalizeSummary(summaryText) {
  if (!summaryText) {
    return '';
  }

  let text = String(summaryText).trim();
  text = text.replace(/^```(?:markdown)?/i, '').replace(/```$/i, '').trim();

  const hasKeyPoints = /key\s*points|要点/i.test(text);
  const hasSteps = /step[-\s]*by[-\s]*step|步骤/i.test(text);
  const hasFact = /fact\s*check|可信|评分|score\s*:\s*\d+\s*\/\s*10/i.test(text);

  if (hasKeyPoints && hasSteps && hasFact) {
    return text;
  }

  return '';
}

function buildFallbackTldr(chat) {
  const firstUser = chat.messages.find((m) => m.role === 'user')?.text || '';
  const firstAssistant = chat.messages.find((m) => m.role === 'assistant')?.text || '';

  const userBrief = firstUser.slice(0, 180).replace(/\n+/g, ' ').trim() || 'User asked for help in this conversation.';
  const assistantBrief = firstAssistant.slice(0, 220).replace(/\n+/g, ' ').trim() || 'Assistant provided a response.';

  return [
    '### Key Points',
    `- ${userBrief}`,
    `- ${assistantBrief}`,
    '',
    '### Step-by-Step',
    '1. User提出问题或任务。',
    '2. Grok给出分析与建议。',
    '3. 对话围绕解决路径继续展开。',
    '',
    '### Fact Check',
    '- Score: 5/10',
    '- Rationale: Auto-fallback summary generated without full model validation.',
    '',
    '### Open Questions',
    '- 是否需要补充外部来源来验证关键事实？',
    '- 是否需要继续细化下一步执行清单？'
  ].join('\n');
}

async function ensureTargetPath(settings) {
  const folderName = (settings.folderName || DEFAULT_SETTINGS.folderName).trim() || DEFAULT_SETTINGS.folderName;

  if (settings.baseFolderPath) {
    return {
      baseFolderPath: settings.baseFolderPath,
      folderName
    };
  }

  if (settings.provider !== 'local-claude') {
    return {
      baseFolderPath: '',
      folderName
    };
  }

  try {
    const picked = await sendNativeMessage({ action: 'pick_folder' });

    if (picked?.success && picked.path) {
      await chrome.storage.sync.set({ baseFolderPath: picked.path });
      return {
        baseFolderPath: picked.path,
        folderName
      };
    }
  } catch (error) {
    // Ignore and fallback to download.
  }

  return {
    baseFolderPath: '',
    folderName
  };
}

async function writeViaNativeHost(baseFolderPath, folderName, filename, markdown) {
  const joined = joinPath(baseFolderPath, folderName, filename);
  const result = await sendNativeMessage({
    action: 'write_file',
    path: joined,
    content: markdown
  });

  if (!result?.success || !result.path) {
    throw new Error(result?.error || 'Native host 写入失败。');
  }

  return result;
}

function buildFilename(title) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '');
  const safeTitle = (title || 'grok-chat')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s_-]/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60) || 'grok-chat';

  return `${stamp}_${safeTitle}.md`;
}

function joinPath(baseFolderPath, folderName, filename) {
  const base = String(baseFolderPath || '').replace(/[\\/]+$/, '');
  const folder = String(folderName || '').replace(/^[\\/]+|[\\/]+$/g, '');
  const name = String(filename || '').replace(/^[\\/]+/, '');
  return `${base}/${folder}/${name}`;
}

async function downloadMarkdown(markdown, folderName, filename) {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  try {
    await chrome.downloads.download({
      url,
      filename: `${folderName || DEFAULT_SETTINGS.folderName}/${filename}`,
      saveAs: false
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

function sendNativeMessage(payload) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendNativeMessage(NATIVE_HOST_NAME, payload, (response) => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(`Native host error: ${err.message}`));
        return;
      }
      resolve(response || {});
    });
  });
}
