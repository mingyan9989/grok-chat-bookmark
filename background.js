const NATIVE_HOST_NAME = 'com.grok.bookmark_writer';

const PROVIDER_DEFAULT_MODELS = {
  openai: 'gpt-4o-mini',
  claude: 'claude-sonnet-4-20250514',
  kimi: 'moonshot-v1-8k',
  zhipu: 'glm-4-flash',
  'local-claude': ''
};

const PROVIDER_DEFAULT_ENDPOINTS = {
  openai: 'https://api.openai.com/v1/chat/completions',
  claude: 'https://api.anthropic.com/v1/messages',
  kimi: 'https://api.moonshot.cn/v1/chat/completions',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
};

const DEFAULT_SETTINGS = {
  aiEnabled: true,
  exportMode: 'tldr',
  language: 'zh-CN',
  provider: 'local-claude',
  apiKey: '',
  baseUrl: '',
  apiModel: '',
  folderName: 'grok bookmark',
  baseFolderPath: '',
  useDownloadFallback: true
};
const MAX_HISTORY = 200;

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
    case 'PING_NATIVE_HOST':
      return pingNativeHost();
    case 'PICK_FOLDER':
      return pickAndSaveFolder();
    case 'EXPORT_CURRENT_GROK_CHAT':
      return exportCurrentGrokChat();
    default:
      throw new Error('Unknown message type.');
  }
}

async function pingNativeHost() {
  try {
    const result = await sendNativeMessage({ action: 'ping' });
    return { success: !!result?.success, version: result?.version || '' };
  } catch (error) {
    return { success: false, version: '' };
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
  const referencedLinks = extractReferencedLinks(chat.messages);
  const tldr = await generateStructuredTldr(chat, settings);
  const finalMarkdown = renderExportMarkdown({ chat, tldr, originalConversation, referencedLinks, settings });
  const filename = buildFilename(chat.title || 'grok-chat');
  const preview = buildCardPreview(tldr, originalConversation);
  const mode = settings.aiEnabled && settings.exportMode === 'tldr' ? 'TLDR' : 'Original';

  const target = await ensureTargetPath(settings);
  if (target.baseFolderPath) {
    try {
      const saved = await writeViaNativeHost(target.baseFolderPath, target.folderName, filename, finalMarkdown);
      notifyExportCard(tab.id, {
        title: chat.title || 'Grok Chat',
        mode,
        method: 'native',
        filePath: saved.path,
        preview
      });
      await saveHistoryEntry({
        title: chat.title || 'Grok Chat',
        sourceUrl: chat.url || '',
        mode,
        provider: settings.provider,
        method: 'native',
        path: saved.path,
        preview
      });
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
  notifyExportCard(tab.id, {
    title: chat.title || 'Grok Chat',
    mode,
    method: 'download',
    filename,
    preview
  });
  await saveHistoryEntry({
    title: chat.title || 'Grok Chat',
    sourceUrl: chat.url || '',
    mode,
    provider: settings.provider,
    method: 'download',
    path: `${settings.folderName}/${filename}`,
    preview
  });
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

function renderExportMarkdown({ chat, tldr, originalConversation, referencedLinks, settings }) {
  const lines = [];

  lines.push(`# ${chat.title || 'Grok Chat'}`);
  lines.push('');
  lines.push(`> **Source**: ${chat.url || 'unknown'}`);
  lines.push(`> **Exported At**: ${new Date().toISOString()}`);
  const modeLabel = settings.aiEnabled && settings.exportMode === 'tldr' ? 'AI TLDR' : 'Original';
  lines.push(`> **Mode**: ${modeLabel}`);
  lines.push(`> **Provider**: ${settings.provider}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Metadata');
  lines.push('');
  lines.push(`- Provider: ${settings.provider}`);
  lines.push(`- Messages: ${chat.messages.length}`);
  lines.push(`- Export Mode: ${modeLabel}`);
  lines.push(`- Language: ${settings.language || 'zh-CN'}`);
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

  if (referencedLinks.length > 0) {
    lines.push('## Referenced Links');
    lines.push('');
    referencedLinks.forEach((link) => lines.push(`- [${link}](${link})`));
    lines.push('');
  }

  return lines.join('\n').trim() + '\n';
}

async function generateStructuredTldr(chat, settings) {
  if (!settings.aiEnabled || settings.exportMode !== 'tldr') {
    return null;
  }

  const fallback = buildFallbackTldr(chat);

  try {
    let tldr = '';
    switch (settings.provider) {
      case 'local-claude':
        tldr = await runLocalClaudeSummary(chat, settings);
        break;
      case 'claude':
        tldr = await runClaudeApiSummary(chat, settings);
        break;
      case 'openai':
      case 'kimi':
      case 'zhipu':
        tldr = await runOpenAICompatibleSummary(chat, settings.provider, settings);
        break;
      default:
        throw new Error('不支持的模型提供方。');
    }

    return normalizeSummary(tldr) || fallback;
  } catch (error) {
    return fallback;
  }
}

function buildSummaryPrompt(chat, language) {
  const langName = getLanguageName(language);
  return [
    `Please write the summary in ${langName}.`,
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
}

async function runLocalClaudeSummary(chat, settings) {
  const system = [
    'You are an expert conversation analyst.',
    'Generate a structured TLDR in markdown.',
    'Keep facts faithful to the conversation only.',
    'Always include a Fact Check score from 1 to 10.',
    `Write output language in ${getLanguageName(settings.language)}.`,
    'Return markdown only, no preface.'
  ].join(' ');

  const result = await sendNativeMessage({
    action: 'call_claude',
    system,
    user: buildSummaryPrompt(chat, settings.language)
  });

  if (!result?.success || !result.text || !result.text.trim()) {
    throw new Error(result?.error || 'Local Claude summarization failed.');
  }

  return result.text.trim();
}

async function runOpenAICompatibleSummary(chat, provider, settings) {
  const apiKey = requireApiKey(settings);
  const endpoint = await resolveApiEndpoint(provider, settings.baseUrl);
  const model = settings.apiModel || PROVIDER_DEFAULT_MODELS[provider];

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert conversation analyst. Return markdown only. Include sections: Key Points, Step-by-Step, Fact Check with Score X/10, and Open Questions.'
        },
        {
          role: 'user',
          content: buildSummaryPrompt(chat, settings.language)
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`${provider} API 请求失败: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || data?.output_text || data?.markdown || data?.output;

  if (typeof text === 'string' && text.trim()) {
    return text.trim();
  }

  throw new Error(`${provider} API 返回内容为空。`);
}

async function runClaudeApiSummary(chat, settings) {
  const apiKey = requireApiKey(settings);
  const endpoint = await resolveApiEndpoint('claude', settings.baseUrl);
  const model = settings.apiModel || PROVIDER_DEFAULT_MODELS.claude;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 1200,
      temperature: 0.2,
      system:
        'You are an expert conversation analyst. Return markdown only. Include sections: Key Points, Step-by-Step, Fact Check with Score X/10, and Open Questions.',
      messages: [
        {
          role: 'user',
          content: buildSummaryPrompt(chat, settings.language)
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API 请求失败: ${response.status}`);
  }

  const data = await response.json();
  const text = Array.isArray(data?.content)
    ? data.content
        .map((item) => (item && typeof item.text === 'string' ? item.text : ''))
        .join('\n')
        .trim()
    : '';

  if (text) {
    return text;
  }

  throw new Error('Claude API 返回内容为空。');
}

function requireApiKey(settings) {
  const key = String(settings.apiKey || '').trim();
  if (!key) {
    throw new Error('当前模型需要 API Key。');
  }
  return key;
}

function getLanguageName(code) {
  const map = {
    'zh-CN': 'Simplified Chinese',
    'zh-TW': 'Traditional Chinese',
    en: 'English',
    ja: 'Japanese',
    ko: 'Korean'
  };
  return map[code] || 'Simplified Chinese';
}

async function resolveApiEndpoint(provider, baseUrl) {
  if (!baseUrl) {
    return PROVIDER_DEFAULT_ENDPOINTS[provider];
  }

  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch (error) {
    throw new Error('Base URL 格式无效，请在设置中重新填写。');
  }

  const path = parsed.pathname.replace(/\/+$/, '');
  if (/\/v\d+\/(chat\/completions|messages)$/i.test(path)) {
    return parsed.origin + path;
  }

  const suffix = provider === 'claude' ? '/messages' : '/chat/completions';
  if (/\/v\d+$/i.test(path)) {
    return parsed.origin + path + suffix;
  }
  if (!path || path === '/') {
    return parsed.origin + '/v1' + suffix;
  }
  return parsed.origin + path + suffix;
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

function extractReferencedLinks(messages) {
  const urlRegex = /(https?:\/\/[^\s)\]}>"']+)/gi;
  const links = new Set();

  messages.forEach((msg) => {
    const text = String(msg?.text || '');
    const matches = text.match(urlRegex) || [];
    matches.forEach((m) => {
      const cleaned = m.replace(/[.,;:!?]+$/, '');
      if (cleaned.length < 8) return;
      links.add(cleaned);
    });
  });

  return Array.from(links).slice(0, 50);
}

function buildCardPreview(tldr, originalConversation) {
  if (tldr) {
    return tldr.replace(/\n{2,}/g, '\n').slice(0, 260);
  }
  return originalConversation.replace(/\n{2,}/g, '\n').slice(0, 260);
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

function notifyExportCard(tabId, payload) {
  if (!tabId) return;
  chrome.tabs.sendMessage(tabId, { type: 'SHOW_EXPORT_CARD', payload }).catch(() => {});
}

async function saveHistoryEntry(entry) {
  const result = await chrome.storage.local.get({ history: [] });
  const history = Array.isArray(result.history) ? result.history : [];

  const normalized = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    title: entry.title || 'Grok Chat',
    sourceUrl: entry.sourceUrl || '',
    mode: entry.mode || 'TLDR',
    provider: entry.provider || 'local-claude',
    method: entry.method || 'download',
    path: entry.path || '',
    preview: entry.preview || ''
  };

  history.unshift(normalized);
  await chrome.storage.local.set({ history: history.slice(0, MAX_HISTORY) });
}
