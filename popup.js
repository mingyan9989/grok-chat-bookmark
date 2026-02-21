const DEFAULTS = {
  provider: 'local-claude',
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  apiKey: '',
  apiModel: 'gpt-4o-mini',
  folderName: 'grok bookmark',
  baseFolderPath: '',
  useDownloadFallback: true
};

const statusEl = document.getElementById('status');
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

async function init() {
  const settings = await loadSettings();

  providerEl.value = settings.provider;
  document.getElementById('apiEndpoint').value = settings.apiEndpoint;
  document.getElementById('apiKey').value = settings.apiKey;
  document.getElementById('apiModel').value = settings.apiModel;
  document.getElementById('folderName').value = settings.folderName;
  document.getElementById('useDownloadFallback').checked = !!settings.useDownloadFallback;

  renderFolderPath(settings.baseFolderPath);
  syncProviderVisibility();
}

function syncProviderVisibility() {
  const useCustomApi = providerEl.value === 'custom-api';
  apiFieldsEl.classList.toggle('hidden', !useCustomApi);
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
    provider,
    apiEndpoint: (document.getElementById('apiEndpoint').value || '').trim() || DEFAULTS.apiEndpoint,
    apiKey: (document.getElementById('apiKey').value || '').trim(),
    apiModel: (document.getElementById('apiModel').value || '').trim() || DEFAULTS.apiModel,
    folderName,
    useDownloadFallback: !!document.getElementById('useDownloadFallback').checked
  };

  if (provider === 'custom-api' && !settings.apiEndpoint) {
    throw new Error('Custom API 模式需要填写 API Endpoint。');
  }

  return settings;
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
