const DEFAULTS = {
  aiEnabled: true,
  exportMode: 'tldr',
  language: 'zh-CN',
  uiLanguage: 'zh',
  theme: 'auto',
  provider: 'local-claude',
  baseUrl: '',
  apiModel: '',
  folderName: 'grok-chat-bookmark',
  baseFolderPath: '',
  useDownloadFallback: true
};
const REPO_URL = 'https://github.com/mingyan9989/grok-chat-bookmark';

const DEFAULT_MODELS = {
  openai: 'gpt-4o-mini',
  claude: 'claude-sonnet-4-20250514',
  kimi: 'moonshot-v1-8k',
  zhipu: 'glm-4-flash',
  'local-claude': 'claude-code-local'
};

const I18N = {
  zh: {
    appTitle: 'Grok Bookmark',
    subtitle: '一键把当前 Grok 对话导出为 Markdown',
    tabSettings: '设置',
    tabHistory: '历史',
    aiToggle: 'AI 摘要开关（默认开启）',
    exportModeLabel: '导出模式',
    exportModeTldr: 'TLDR 摘要模式',
    exportModeOriginal: '原文模式（跳过 AI 摘要）',
    summaryLangLabel: '摘要语言',
    summaryLangZhCn: '简体中文',
    summaryLangZhTw: '繁體中文',
    summaryLangEn: 'English',
    summaryLangJa: '日本語',
    summaryLangKo: '한국어',
    providerLabel: 'AI 提供方',
    providerLocal: 'Claude Code（默认）',
    apiKeyLabel: 'API Key',
    baseUrlLabel: 'Base URL（可选）',
    modelLabel: 'Model',
    modelHintPrefix: '默认',
    folderNameLabel: '目标子文件夹名',
    rootDirLabel: 'Claude Code 根目录',
    folderUnselected: '未选择（首次导出会提示你选择）',
    pickFolderBtn: '选择',
    clearFolderBtn: '清除',
    downloadScriptBtn: '一键下载安装脚本',
    fallbackCheckbox: '当本地写入失败时自动下载到浏览器 Download',
    saveBtn: '保存设置',
    exportBtn: '导出当前对话',
    historyTitle: '导出历史',
    clearHistoryBtn: '清空',
    historyEmpty: '暂无历史记录',
    historyNoPreview: '(无预览)',
    modeTLDR: 'TLDR',
    modeOriginal: '原文',
    folderHintReady: 'Native Helper 已就绪：可写入你选择的本地目录。',
    folderHintMissing: '未安装 Native Helper：将回退到 Downloads/grok-chat-bookmark/。',
    themePrefix: '主题',
    themeAuto: '自动',
    themeLight: '浅色',
    themeDark: '深色',
    statusSettingsSaved: '设置已保存。',
    statusNativeMissing: '未检测到 Native Helper，请先按 README 安装。',
    statusOpeningPicker: '正在打开文件夹选择器...',
    statusRootUpdated: '已更新 Claude Code 根目录。',
    statusFolderCleared: '已清除自定义目录，将使用下载回退。',
    statusScriptDownloaded: '脚本已下载到 Downloads/install-btl-native.sh',
    statusScriptDownloadFailed: '脚本下载失败，请重试。',
    statusExporting: '正在导出当前 Grok 对话...',
    statusExportSuccessNative: '导出成功: {path}',
    statusExportSuccessDownload: '导出成功（下载）: {filename}',
    statusHistoryCleared: '历史记录已清空。',
    errBaseUrlInvalid: 'Base URL 格式无效。',
    errApiKeyRequired: '当前模型需要填写 API Key。',
    errUnknownExtension: '扩展响应异常。'
  },
  en: {
    appTitle: 'Grok Bookmark',
    subtitle: 'One-click export of current Grok chat to Markdown',
    tabSettings: 'Settings',
    tabHistory: 'History',
    aiToggle: 'AI summary toggle (enabled by default)',
    exportModeLabel: 'Export Mode',
    exportModeTldr: 'TLDR Summary Mode',
    exportModeOriginal: 'Original Mode (skip AI summary)',
    summaryLangLabel: 'Summary Language',
    summaryLangZhCn: 'Simplified Chinese',
    summaryLangZhTw: 'Traditional Chinese',
    summaryLangEn: 'English',
    summaryLangJa: 'Japanese',
    summaryLangKo: 'Korean',
    providerLabel: 'AI Provider',
    providerLocal: 'Claude Code (Default)',
    apiKeyLabel: 'API Key',
    baseUrlLabel: 'Base URL (Optional)',
    modelLabel: 'Model',
    modelHintPrefix: 'Default',
    folderNameLabel: 'Target Subfolder Name',
    rootDirLabel: 'Claude Code Root Folder',
    folderUnselected: 'Not selected (you will be prompted on first export)',
    pickFolderBtn: 'Choose',
    clearFolderBtn: 'Clear',
    downloadScriptBtn: 'One-click Download Install Script',
    fallbackCheckbox: 'Auto-download to browser Downloads if native write fails',
    saveBtn: 'Save Settings',
    exportBtn: 'Export Current Chat',
    historyTitle: 'Export History',
    clearHistoryBtn: 'Clear',
    historyEmpty: 'No history yet',
    historyNoPreview: '(no preview)',
    modeTLDR: 'TLDR',
    modeOriginal: 'Original',
    folderHintReady: 'Native Helper is ready: files can be written to your selected local folder.',
    folderHintMissing: 'Native Helper not installed: fallback path is Downloads/grok-chat-bookmark/.',
    themePrefix: 'Theme',
    themeAuto: 'Auto',
    themeLight: 'Light',
    themeDark: 'Dark',
    statusSettingsSaved: 'Settings saved.',
    statusNativeMissing: 'Native Helper not detected. Please install it from README first.',
    statusOpeningPicker: 'Opening folder picker...',
    statusRootUpdated: 'Claude Code root folder updated.',
    statusFolderCleared: 'Custom folder cleared. Download fallback will be used.',
    statusScriptDownloaded: 'Script downloaded to Downloads/install-btl-native.sh',
    statusScriptDownloadFailed: 'Failed to download script. Please retry.',
    statusExporting: 'Exporting current Grok chat...',
    statusExportSuccessNative: 'Export success: {path}',
    statusExportSuccessDownload: 'Export success (download): {filename}',
    statusHistoryCleared: 'History cleared.',
    errBaseUrlInvalid: 'Invalid Base URL format.',
    errApiKeyRequired: 'API key is required for this provider.',
    errUnknownExtension: 'Unexpected extension response.'
  }
};

const statusEl = document.getElementById('status');
const aiEnabledEl = document.getElementById('aiEnabled');
const exportModeEl = document.getElementById('exportMode');
const languageEl = document.getElementById('language');
const uiLanguageEl = document.getElementById('uiLanguage');
const providerEl = document.getElementById('provider');
const apiFieldsEl = document.getElementById('apiFields');
const folderPathEl = document.getElementById('folderPath');
const themeBtnEl = document.getElementById('themeToggle');
const appTitleEl = document.getElementById('appTitle');

let nativeHostAvailable = false;
let currentUiLanguage = 'zh';
let currentBaseFolderPath = '';

init().catch((error) => {
  setStatus(error.message, true);
});

document.getElementById('saveBtn').addEventListener('click', onSave);
document.getElementById('exportBtn').addEventListener('click', onExport);
document.getElementById('pickFolder').addEventListener('click', onPickFolder);
document.getElementById('clearFolder').addEventListener('click', onClearFolder);
document.getElementById('downloadNativeScript').addEventListener('click', onDownloadNativeScript);
document.getElementById('clearHistoryBtn').addEventListener('click', onClearHistory);
themeBtnEl.addEventListener('click', cycleTheme);
appTitleEl.addEventListener('click', openRepository);
appTitleEl.addEventListener('keydown', onTitleKeydown);
uiLanguageEl.addEventListener('change', onUiLanguageChange);
providerEl.addEventListener('change', syncProviderVisibility);
aiEnabledEl.addEventListener('change', syncProviderVisibility);
exportModeEl.addEventListener('change', syncProviderVisibility);
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab') || 'settings'));
});

async function init() {
  await migratePlaintextApiKeyFromSync();
  const settings = await loadSettings();
  const apiKeyPlain = await loadDecryptedApiKey();

  currentUiLanguage = normalizeUiLanguage(settings.uiLanguage || 'zh');
  uiLanguageEl.value = currentUiLanguage;
  applyUILanguage(currentUiLanguage);

  applyTheme(settings.theme || 'auto');
  nativeHostAvailable = await checkNativeHost();

  aiEnabledEl.checked = !!settings.aiEnabled;
  exportModeEl.value = settings.exportMode;
  languageEl.value = settings.language || DEFAULTS.language;
  providerEl.value = settings.provider;
  document.getElementById('apiKey').value = apiKeyPlain;
  document.getElementById('baseUrl').value = settings.baseUrl || '';
  document.getElementById('apiModel').value = settings.apiModel;
  document.getElementById('folderName').value = settings.folderName;
  document.getElementById('useDownloadFallback').checked = !!settings.useDownloadFallback;

  currentBaseFolderPath = settings.baseFolderPath || '';
  renderFolderPath(currentBaseFolderPath);
  updateFolderHint();
  syncProviderVisibility();
  await loadHistory();
}

async function onUiLanguageChange() {
  currentUiLanguage = normalizeUiLanguage(uiLanguageEl.value);
  applyUILanguage(currentUiLanguage);
  await chrome.storage.sync.set({ uiLanguage: currentUiLanguage });
  await loadHistory();
}

function normalizeUiLanguage(value) {
  return value === 'en' ? 'en' : 'zh';
}

function t(key, vars = {}) {
  const dict = I18N[currentUiLanguage] || I18N.zh;
  const tpl = dict[key] || I18N.zh[key] || key;
  return tpl.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''));
}

function applyUILanguage(lang) {
  currentUiLanguage = normalizeUiLanguage(lang);
  document.documentElement.lang = currentUiLanguage === 'en' ? 'en' : 'zh-CN';

  document.getElementById('appTitle').textContent = t('appTitle');
  document.getElementById('subtitle').textContent = t('subtitle');
  document.getElementById('tabSettingsBtn').textContent = t('tabSettings');
  document.getElementById('tabHistoryBtn').textContent = t('tabHistory');

  document.getElementById('aiToggleText').textContent = t('aiToggle');
  document.getElementById('exportModeLabel').textContent = t('exportModeLabel');
  document.getElementById('exportModeTldrOpt').textContent = t('exportModeTldr');
  document.getElementById('exportModeOriginalOpt').textContent = t('exportModeOriginal');

  document.getElementById('summaryLangLabel').textContent = t('summaryLangLabel');
  document.getElementById('sumLangZhCn').textContent = t('summaryLangZhCn');
  document.getElementById('sumLangZhTw').textContent = t('summaryLangZhTw');
  document.getElementById('sumLangEn').textContent = t('summaryLangEn');
  document.getElementById('sumLangJa').textContent = t('summaryLangJa');
  document.getElementById('sumLangKo').textContent = t('summaryLangKo');

  document.getElementById('providerLabel').textContent = t('providerLabel');
  document.getElementById('providerLocalOpt').textContent = t('providerLocal');

  document.getElementById('apiKeyLabel').textContent = t('apiKeyLabel');
  document.getElementById('baseUrlLabel').textContent = t('baseUrlLabel');
  document.getElementById('modelLabel').textContent = t('modelLabel');

  document.getElementById('folderNameLabel').textContent = t('folderNameLabel');
  document.getElementById('rootDirLabel').textContent = t('rootDirLabel');
  document.getElementById('pickFolder').textContent = t('pickFolderBtn');
  document.getElementById('clearFolder').textContent = t('clearFolderBtn');
  document.getElementById('downloadNativeScript').textContent = t('downloadScriptBtn');
  document.getElementById('downloadFallbackText').textContent = t('fallbackCheckbox');

  document.getElementById('saveBtn').textContent = t('saveBtn');
  document.getElementById('exportBtn').textContent = t('exportBtn');
  document.getElementById('historyTitle').textContent = t('historyTitle');
  document.getElementById('clearHistoryBtn').textContent = t('clearHistoryBtn');
  document.getElementById('historyEmpty').textContent = t('historyEmpty');

  renderFolderPath(currentBaseFolderPath);
  updateFolderHint();
  updateModelHint(providerEl.value);
  applyTheme(document.documentElement.getAttribute('data-theme') || 'auto');
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
    await validateApiKeyRequirement(next);
    await persistApiKey(next.apiKey);
    const syncPayload = stripSensitiveSettings(next);
    await chrome.storage.sync.set(syncPayload);
    setStatus(t('statusSettingsSaved'));
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function onPickFolder() {
  if (!nativeHostAvailable) {
    setStatus(t('statusNativeMissing'), true);
    return;
  }
  try {
    setStatus(t('statusOpeningPicker'));
    const result = await sendMessage({ type: 'PICK_FOLDER' });
    currentBaseFolderPath = result.baseFolderPath || '';
    renderFolderPath(currentBaseFolderPath);
    updateFolderHint();
    setStatus(t('statusRootUpdated'));
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function onClearFolder() {
  await chrome.storage.sync.remove(['baseFolderPath']);
  currentBaseFolderPath = '';
  renderFolderPath(currentBaseFolderPath);
  updateFolderHint();
  setStatus(t('statusFolderCleared'));
}

async function onDownloadNativeScript() {
  const script = buildNativeInstallScript(chrome.runtime.id, currentUiLanguage);
  const blob = new Blob([script], { type: 'text/x-shellscript;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    await chrome.downloads.download({
      url,
      filename: 'install-btl-native.sh',
      saveAs: false
    });
    setStatus(t('statusScriptDownloaded'));
  } catch (error) {
    setStatus(t('statusScriptDownloadFailed'), true);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }
}

async function onExport() {
  try {
    const next = collectSettings();
    await validateApiKeyRequirement(next);
    await persistApiKey(next.apiKey);
    const syncPayload = stripSensitiveSettings(next);
    await chrome.storage.sync.set(syncPayload);

    setStatus(t('statusExporting'));
    const result = await sendMessage({ type: 'EXPORT_CURRENT_GROK_CHAT' });

    if (result.method === 'native') {
      setStatus(t('statusExportSuccessNative', { path: result.filePath }));
    } else {
      setStatus(t('statusExportSuccessDownload', { filename: result.filename }));
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
    uiLanguage: currentUiLanguage,
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
      throw new Error(t('errBaseUrlInvalid'));
    }
    settings.baseUrl = normalized;
  }

  return settings;
}

function updateModelHint(provider) {
  const hint = DEFAULT_MODELS[provider] || 'auto';
  document.getElementById('modelHint').textContent = `${t('modelHintPrefix')}: ${hint}`;
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

function stripSensitiveSettings(settings) {
  const next = { ...settings };
  delete next.apiKey;
  return next;
}

async function validateApiKeyRequirement(settings) {
  const needKey = settings.aiEnabled && settings.exportMode === 'tldr' && settings.provider !== 'local-claude';
  if (!needKey) return;

  if (settings.apiKey) return;

  const localData = await chrome.storage.local.get('encryptedApiKey');
  if (!localData.encryptedApiKey) {
    throw new Error(t('errApiKeyRequired'));
  }
}

async function loadSettings() {
  const loaded = await chrome.storage.sync.get(Object.keys(DEFAULTS));
  return {
    ...DEFAULTS,
    ...loaded
  };
}

async function migratePlaintextApiKeyFromSync() {
  const syncData = await chrome.storage.sync.get({ apiKey: '' });
  if (!syncData.apiKey) {
    return;
  }

  const encrypted = await encryptApiKey(syncData.apiKey);
  await chrome.storage.local.set({ encryptedApiKey: encrypted });
  await chrome.storage.sync.remove('apiKey');
}

async function loadDecryptedApiKey() {
  const localData = await chrome.storage.local.get('encryptedApiKey');
  if (!localData.encryptedApiKey) {
    return '';
  }

  try {
    return await decryptApiKey(localData.encryptedApiKey);
  } catch (error) {
    return '';
  }
}

async function persistApiKey(apiKeyPlain) {
  const value = String(apiKeyPlain || '').trim();
  if (!value) return;
  const encrypted = await encryptApiKey(value);
  await chrome.storage.local.set({ encryptedApiKey: encrypted });
}

function renderFolderPath(path) {
  const clearBtn = document.getElementById('clearFolder');
  if (!path) {
    folderPathEl.textContent = t('folderUnselected');
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

function openRepository() {
  chrome.tabs.create({ url: REPO_URL });
}

function onTitleKeydown(event) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openRepository();
  }
}

async function sendMessage(payload, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(payload, (response) => {
          const err = chrome.runtime.lastError;
          if (err) {
            reject(new Error(err.message));
            return;
          }
          if (!response?.ok) {
            reject(new Error(response?.error || t('errUnknownExtension')));
            return;
          }
          resolve(response);
        });
      });
      return response;
    } catch (error) {
      const isConnectionError = error.message.includes('Could not establish connection')
        || error.message.includes('Receiving end does not exist');
      if (isConnectionError && i < retries - 1) {
        await new Promise(r => setTimeout(r, 200 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
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
  hint.textContent = nativeHostAvailable ? t('folderHintReady') : t('folderHintMissing');
}

function applyTheme(theme) {
  const resolved = ['auto', 'light', 'dark'].includes(theme) ? theme : 'auto';
  document.documentElement.setAttribute('data-theme', resolved);
  document.body.setAttribute('data-theme', resolved);

  const themeLabelMap = {
    auto: t('themeAuto'),
    light: t('themeLight'),
    dark: t('themeDark')
  };
  themeBtnEl.textContent = `${t('themePrefix')}: ${themeLabelMap[resolved] || themeLabelMap.auto}`;
}

function cycleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'auto';
  const order = ['auto', 'light', 'dark'];
  const idx = order.indexOf(current);
  const next = order[(idx + 1) % order.length];
  applyTheme(next);
  chrome.storage.sync.set({ theme: next });
}

function buildNativeInstallScript(extensionId, uiLang) {
  const isEn = uiLang === 'en';
  const repoRaw = REPO_URL.replace('github.com', 'raw.githubusercontent.com') + '/main';
  const errPython = isEn
    ? 'echo "Error: Python 3 is required. Please install Python 3 first."'
    : 'echo "错误：需要 Python 3，请先安装。"';
  const errCurl = isEn
    ? 'echo "Error: curl is required to download the native host script."'
    : 'echo "错误：需要 curl 来下载 native host 脚本。"';
  const errDownload = isEn
    ? 'echo "Download failed. Please check your network and retry."'
    : 'echo "下载失败，请检查网络后重试。"';
  const errNoBrowser = isEn
    ? 'echo "No supported Chromium browser detected."'
    : 'echo "未检测到支持的 Chromium 浏览器。"';
  const errUnsupportedOS = isEn
    ? 'echo "Unsupported OS: $(uname -s). Only macOS is supported."'
    : 'echo "不支持的操作系统：$(uname -s)。目前仅支持 macOS。"';
  const doneTip = isEn
    ? 'echo "Done. Please restart your browser."'
    : 'echo "完成。请重启浏览器。"';

  return [
    '#!/bin/bash',
    'set -e',
    '',
    `EXT_ID="${extensionId}"`,
    'HOST_NAME="com.grok.chat_bookmark_writer"',
    'INSTALL_DIR="$HOME/.grok-bookmark"',
    `SCRIPT_URL="${repoRaw}/native-host/grok_file_writer.py"`,
    '',
    '# ── Check dependencies ──',
    'if ! command -v python3 &>/dev/null; then',
    `  ${errPython}`,
    '  exit 1',
    'fi',
    'if ! command -v curl &>/dev/null; then',
    `  ${errCurl}`,
    '  exit 1',
    'fi',
    '',
    '# ── Download native host script ──',
    'mkdir -p "$INSTALL_DIR"',
    'if ! curl -fsSL "$SCRIPT_URL" -o "$INSTALL_DIR/grok_file_writer.py"; then',
    `  ${errDownload}`,
    '  exit 1',
    'fi',
    'chmod +x "$INSTALL_DIR/grok_file_writer.py"',
    'HOST_PATH="$INSTALL_DIR/grok_file_writer.py"',
    '',
    '# ── Check macOS ──',
    'if [ "$(uname -s)" != "Darwin" ]; then',
    `  ${errUnsupportedOS}`,
    '  exit 1',
    'fi',
    '',
    'BROWSER_DIRS=(',
    '  "$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"',
    '  "$HOME/Library/Application Support/Google/Chrome Beta/NativeMessagingHosts"',
    '  "$HOME/Library/Application Support/Google/Chrome Canary/NativeMessagingHosts"',
    '  "$HOME/Library/Application Support/Chromium/NativeMessagingHosts"',
    '  "$HOME/Library/Application Support/BraveSoftware/Brave-Browser/NativeMessagingHosts"',
    '  "$HOME/Library/Application Support/Microsoft Edge/NativeMessagingHosts"',
    ')',
    '',
    '# ── Install native host manifest ──',
    'count=0',
    'for dir in "${BROWSER_DIRS[@]}"; do',
    '  parent="$(dirname "$dir")"',
    '  if [ -d "$parent" ]; then',
    '    mkdir -p "$dir"',
    '    cat > "$dir/$HOST_NAME.json" <<MANIFEST',
    '{',
    '  "name": "com.grok.chat_bookmark_writer",',
    '  "description": "File writer for Grok Bookmark extension",',
    '  "path": "$HOST_PATH",',
    '  "type": "stdio",',
    `  "allowed_origins": ["chrome-extension://${extensionId}/"]`,
    '}',
    'MANIFEST',
    '    echo "Installed: $dir/$HOST_NAME.json"',
    '    count=$((count + 1))',
    '  fi',
    'done',
    '',
    'if [ "$count" -eq 0 ]; then',
    `  ${errNoBrowser}`,
    '  exit 1',
    'fi',
    '',
    doneTip,
    ''
  ].join('\n');
}

async function getOrCreateEncryptionKey() {
  const stored = await chrome.storage.local.get('encKey');
  if (stored.encKey) {
    return crypto.subtle.importKey('raw', new Uint8Array(stored.encKey), 'AES-GCM', false, ['encrypt', 'decrypt']);
  }

  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const exported = await crypto.subtle.exportKey('raw', key);
  await chrome.storage.local.set({ encKey: Array.from(new Uint8Array(exported)) });
  return key;
}

async function encryptApiKey(plaintext) {
  const key = await getOrCreateEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(cipher))
  };
}

async function decryptApiKey(encrypted) {
  const key = await getOrCreateEncryptionKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(encrypted.iv) },
    key,
    new Uint8Array(encrypted.data)
  );
  return new TextDecoder().decode(decrypted);
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
    const mode = String(entry.mode || '').toLowerCase().includes('original') ? t('modeOriginal') : t('modeTLDR');
    meta.textContent = `${time} · ${mode} · ${entry.provider || 'local-claude'}`;

    const preview = document.createElement('p');
    preview.className = 'preview';
    preview.textContent = (entry.preview || '').slice(0, 200) || t('historyNoPreview');

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
  setStatus(t('statusHistoryCleared'));
}
