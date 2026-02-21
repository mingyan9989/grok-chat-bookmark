const DEFAULTS = {
  aiEnabled: true,
  exportMode: 'tldr',
  language: 'zh-CN',
  theme: 'auto',
  provider: 'local-claude',
  apiKey: '',
  baseUrl: '',
  apiModel: '',
  folderName: 'grok bookmark',
  baseFolderPath: '',
  useDownloadFallback: true
};

const DEFAULT_MODELS = {
  openai: 'gpt-4o-mini',
  claude: 'claude-sonnet-4-20250514',
  kimi: 'moonshot-v1-8k',
  zhipu: 'glm-4-flash',
  'local-claude': 'claude-code-local'
};

const statusEl = document.getElementById('status');
const aiEnabledEl = document.getElementById('aiEnabled');
const exportModeEl = document.getElementById('exportMode');
const languageEl = document.getElementById('language');
const providerEl = document.getElementById('provider');
const apiFieldsEl = document.getElementById('apiFields');
const folderPathEl = document.getElementById('folderPath');
const themeBtnEl = document.getElementById('themeToggle');
let nativeHostAvailable = false;

init().catch((error) => {
  setStatus(error.message, true);
});

document.getElementById('saveBtn').addEventListener('click', onSave);
document.getElementById('exportBtn').addEventListener('click', onExport);
document.getElementById('pickFolder').addEventListener('click', onPickFolder);
document.getElementById('clearFolder').addEventListener('click', onClearFolder);
document.getElementById('clearHistoryBtn').addEventListener('click', onClearHistory);
themeBtnEl.addEventListener('click', cycleTheme);
providerEl.addEventListener('change', syncProviderVisibility);
aiEnabledEl.addEventListener('change', syncProviderVisibility);
exportModeEl.addEventListener('change', syncProviderVisibility);
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab') || 'settings'));
});

async function init() {
  nativeHostAvailable = await checkNativeHost();
  const settings = await loadSettings();

  applyTheme(settings.theme || 'auto');
  aiEnabledEl.checked = !!settings.aiEnabled;
  exportModeEl.value = settings.exportMode;
  languageEl.value = settings.language || DEFAULTS.language;
  providerEl.value = settings.provider;
  document.getElementById('apiKey').value = settings.apiKey;
  document.getElementById('baseUrl').value = settings.baseUrl || '';
  document.getElementById('apiModel').value = settings.apiModel;
  document.getElementById('folderName').value = settings.folderName;
  document.getElementById('useDownloadFallback').checked = !!settings.useDownloadFallback;

  renderFolderPath(settings.baseFolderPath);
  updateFolderHint();
  syncProviderVisibility();
  await loadHistory();
}

function syncProviderVisibility() {
  const aiEnabled = !!aiEnabledEl.checked;
  const useTldr = exportModeEl.value === 'tldr';
  const isLocal = providerEl.value === 'local-claude';
  const showApi = aiEnabled && useTldr && !isLocal;

  providerEl.disabled = !(aiEnabled && useTldr);
  apiFieldsEl.classList.toggle('hidden', !showApi);
  updateModelHint(providerEl.value);
}

async function onSave() {
  try {
    const next = collectSettings();
    await chrome.storage.sync.set(next);
    setStatus('设置已保存。');
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function onPickFolder() {
  if (!nativeHostAvailable) {
    setStatus('未检测到 Native Helper，请先按 README 安装。', true);
    return;
  }
  try {
    setStatus('正在打开文件夹选择器...');
    const result = await sendMessage({ type: 'PICK_FOLDER' });
    renderFolderPath(result.baseFolderPath);
    updateFolderHint();
    setStatus('已更新 Claude Code 根目录。');
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function onClearFolder() {
  await chrome.storage.sync.remove(['baseFolderPath']);
  renderFolderPath('');
  updateFolderHint();
  setStatus('已清除自定义目录，将使用下载回退。');
}

async function onExport() {
  try {
    const next = collectSettings();
    await chrome.storage.sync.set(next);

    setStatus('正在导出当前 Grok 对话...');
    const result = await sendMessage({ type: 'EXPORT_CURRENT_GROK_CHAT' });

    if (result.method === 'native') {
      setStatus(`导出成功: ${result.filePath}`);
    } else {
      setStatus(`导出成功（下载）: ${result.filename}`);
    }
    await loadHistory();
  } catch (error) {
    setStatus(error.message, true);
  }
}

function collectSettings() {
  const provider = providerEl.value;
  const folderName = (document.getElementById('folderName').value || '').trim() || DEFAULTS.folderName;

  const settings = {
    aiEnabled: !!aiEnabledEl.checked,
    exportMode: exportModeEl.value,
    language: languageEl.value,
    theme: document.documentElement.getAttribute('data-theme') || 'auto',
    provider,
    apiKey: (document.getElementById('apiKey').value || '').trim(),
    baseUrl: '',
    apiModel: (document.getElementById('apiModel').value || '').trim(),
    folderName,
    useDownloadFallback: !!document.getElementById('useDownloadFallback').checked
  };

  const baseUrlInput = (document.getElementById('baseUrl').value || '').trim();
  if (baseUrlInput) {
    const normalized = normalizeBaseUrl(baseUrlInput);
    if (!normalized) {
      throw new Error('Base URL 格式无效。');
    }
    settings.baseUrl = normalized;
  }

  if (settings.aiEnabled && settings.exportMode === 'tldr' && provider !== 'local-claude' && !settings.apiKey) {
    throw new Error('当前模型需要填写 API Key。');
  }

  return settings;
}

function updateModelHint(provider) {
  const hint = DEFAULT_MODELS[provider] || 'auto';
  document.getElementById('modelHint').textContent = `默认: ${hint}`;
}

function normalizeBaseUrl(value) {
  try {
    let normalizedInput = value;
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(normalizedInput)) {
      normalizedInput = `https://${normalizedInput}`;
    }
    const parsed = new URL(normalizedInput);
    if (!/^https?:$/.test(parsed.protocol)) {
      return '';
    }
    return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`;
  } catch (error) {
    return '';
  }
}

async function loadSettings() {
  const loaded = await chrome.storage.sync.get(Object.keys(DEFAULTS));
  return {
    ...DEFAULTS,
    ...loaded
  };
}

function renderFolderPath(path) {
  const clearBtn = document.getElementById('clearFolder');
  if (!path) {
    folderPathEl.textContent = '未选择（首次导出会提示你选择）';
    clearBtn.classList.add('hidden');
    return;
  }
  folderPathEl.textContent = path;
  clearBtn.classList.remove('hidden');
}

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle('error', isError);
  statusEl.classList.toggle('ok', !isError);
}

function sendMessage(payload) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(payload, (response) => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      if (!response?.ok) {
        reject(new Error(response?.error || 'Unknown extension error.'));
        return;
      }
      resolve(response);
    });
  });
}

async function checkNativeHost() {
  try {
    const result = await sendMessage({ type: 'PING_NATIVE_HOST' });
    return !!result.success;
  } catch (error) {
    return false;
  }
}

function updateFolderHint() {
  const hint = document.getElementById('folderHint');
  if (nativeHostAvailable) {
    hint.textContent = 'Native Helper 已就绪：可写入你选择的本地目录。';
  } else {
    hint.textContent = '未安装 Native Helper：将回退保存到浏览器下载目录。';
  }
}

function applyTheme(theme) {
  const resolved = ['auto', 'light', 'dark'].includes(theme) ? theme : 'auto';
  document.documentElement.setAttribute('data-theme', resolved);
  document.body.setAttribute('data-theme', resolved);
  const map = { auto: '自动', light: '浅色', dark: '深色' };
  themeBtnEl.textContent = `主题: ${map[resolved] || '自动'}`;
}

function cycleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'auto';
  const order = ['auto', 'light', 'dark'];
  const idx = order.indexOf(current);
  const next = order[(idx + 1) % order.length];
  applyTheme(next);
  chrome.storage.sync.set({ theme: next });
}

function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === name);
  });
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `tab-${name}`);
  });
  if (name === 'history') {
    loadHistory().catch(() => {});
  }
}

async function loadHistory() {
  const result = await chrome.storage.local.get({ history: [] });
  const history = Array.isArray(result.history) ? result.history : [];
  const listEl = document.getElementById('historyList');
  const emptyEl = document.getElementById('historyEmpty');

  listEl.innerHTML = '';
  if (history.length === 0) {
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';

  const fragment = document.createDocumentFragment();
  history.forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'history-item';

    const title = document.createElement('p');
    title.className = 'title';
    title.textContent = entry.title || 'Grok Chat';

    const meta = document.createElement('p');
    meta.className = 'meta';
    const time = new Date(entry.timestamp || Date.now()).toLocaleString();
    meta.textContent = `${time} · ${entry.mode || 'TLDR'} · ${entry.provider || 'local-claude'}`;

    const preview = document.createElement('p');
    preview.className = 'preview';
    preview.textContent = (entry.preview || '').slice(0, 200) || '(no preview)';

    item.appendChild(title);
    item.appendChild(meta);
    item.appendChild(preview);
    fragment.appendChild(item);
  });

  listEl.appendChild(fragment);
}

async function onClearHistory() {
  await chrome.storage.local.set({ history: [] });
  await loadHistory();
  setStatus('历史记录已清空。');
}
