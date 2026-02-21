const DEFAULTS = {
  aiEnabled: true,
  exportMode: 'tldr',
  provider: 'local-claude',
  apiKey: '',
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
const providerEl = document.getElementById('provider');
const apiFieldsEl = document.getElementById('apiFields');
const folderPathEl = document.getElementById('folderPath');

init().catch((error) => {
  setStatus(error.message, true);
});

document.getElementById('saveBtn').addEventListener('click', onSave);
document.getElementById('exportBtn').addEventListener('click', onExport);
document.getElementById('pickFolder').addEventListener('click', onPickFolder);
providerEl.addEventListener('change', syncProviderVisibility);
aiEnabledEl.addEventListener('change', syncProviderVisibility);
exportModeEl.addEventListener('change', syncProviderVisibility);

async function init() {
  const settings = await loadSettings();

  aiEnabledEl.checked = !!settings.aiEnabled;
  exportModeEl.value = settings.exportMode;
  providerEl.value = settings.provider;
  document.getElementById('apiKey').value = settings.apiKey;
  document.getElementById('apiModel').value = settings.apiModel;
  document.getElementById('folderName').value = settings.folderName;
  document.getElementById('useDownloadFallback').checked = !!settings.useDownloadFallback;

  renderFolderPath(settings.baseFolderPath);
  syncProviderVisibility();
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
  try {
    setStatus('正在打开文件夹选择器...');
    const result = await sendMessage({ type: 'PICK_FOLDER' });
    renderFolderPath(result.baseFolderPath);
    setStatus('已更新 Claude Code 根目录。');
  } catch (error) {
    setStatus(error.message, true);
  }
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
    provider,
    apiKey: (document.getElementById('apiKey').value || '').trim(),
    apiModel: (document.getElementById('apiModel').value || '').trim(),
    folderName,
    useDownloadFallback: !!document.getElementById('useDownloadFallback').checked
  };

  if (settings.aiEnabled && settings.exportMode === 'tldr' && provider !== 'local-claude' && !settings.apiKey) {
    throw new Error('当前模型需要填写 API Key。');
  }

  return settings;
}

function updateModelHint(provider) {
  const hint = DEFAULT_MODELS[provider] || 'auto';
  document.getElementById('modelHint').textContent = `默认: ${hint}`;
}

async function loadSettings() {
  const loaded = await chrome.storage.sync.get(Object.keys(DEFAULTS));
  return {
    ...DEFAULTS,
    ...loaded
  };
}

function renderFolderPath(path) {
  if (!path) {
    folderPathEl.textContent = '未选择（首次导出会提示你选择）';
    return;
  }
  folderPathEl.textContent = path;
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
