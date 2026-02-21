# Grok Bookmark

> A Chrome extension that exports the current Grok conversation to Markdown with one click, and saves it to your Claude Code folder by default.

English | [中文](README.md)

## Key Highlights | 核心亮点

- One-click export of the current Grok conversation to Markdown. / 一键导出 Grok 当前对话为 Markdown。
- Supports TLDR summary mode and original-content mode. / 支持 TLDR 摘要模式与原文模式。
- Supports local Claude Code and cloud providers (OpenAI/Claude/Kimi/Zhipu). / 支持本地 Claude Code 与云模型（OpenAI/Claude/Kimi/智谱）。
- Supports multilingual summaries (zh-CN/zh-TW/English/日本語/한국어). / 支持多语言摘要（简中/繁中/English/日本語/한국어）。
- Supports UI language switch (English/中文) and theme modes (Auto/Light/Dark). / 支持界面语言切换（English/中文）与主题模式（自动/浅色/深色）。
- Supports custom save path via Native Helper (default: Downloads/grok-chat-bookmark/). / 支持通过 Native Helper 自定义保存路径（默认：Downloads/grok-chat-bookmark/）。
- API keys are encrypted with AES-GCM in local storage and never synced. / API Key 使用 AES-GCM 在本地加密存储，不会同步。

## Features

- One-click export from the current Grok chat page
- Structured TLDR in AI mode: `Key Points / Step-by-Step / Fact Check(1-10) / Open Questions`
- AI toggle (enabled by default) to disable summarization instantly
- Original mode to save raw conversation + metadata without AI TLDR
- Claude Code flow by default (local Claude CLI, no API key required)
- Multi-provider support: `OpenAI / Claude / Kimi / Zhipu / Local Claude`
- Optional API key mode for cloud providers (`API Key + Model`)
- Custom Base URL support for proxy/private gateway routing
- Deep extraction: auto-expands collapsed content such as “Show more” before export
- Card stacking: consecutive exports show stacked result cards at bottom-right
- History: exports are saved and viewable in the popup History tab
- Markdown archive includes TLDR + original conversation with metadata/referenced links
- Custom save path via Native Helper with select/clear folder flow
- Multi-language summary: Simplified Chinese / Traditional Chinese / English / Japanese / Korean
- Theme support: auto/light/dark modes for popup and export cards
- UI language switch: popup UI supports Chinese / English
- Secure storage: API keys are AES-GCM encrypted in local storage (not synced)
- Custom base folder (Claude Code root)
- Custom subfolder name (default: `grok-chat-bookmark`)
- Download fallback when native write fails

## Installation

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select your local `grok-chat-bookmark` project folder

## Default Mode (Recommended)

Default mode is `Claude Code` and does not require an API key.

### 1) Install Claude Code CLI

```bash
npm install -g @anthropic-ai/claude-code
claude login
```

### 2) Install Native Host (one-time)

1. Open `chrome://extensions/` and copy this extension ID
2. Run:

```bash
cd "<your-project-path>/grok-chat-bookmark/native-host"
bash install-macos.sh <your-extension-id>
```

3. Restart your browser

### 3) First Export

1. Open a Grok conversation page
2. Click the extension icon
3. Click `导出当前对话` (Export Current Chat)
4. On first use, pick your Claude Code root folder
5. File path format:

```text
<selected-root>/<folderName>/<timestamp>_<title>.md
```

`folderName` defaults to `grok-chat-bookmark`.

## Custom Save Path (Optional)

By default, files are saved to `Downloads/grok-chat-bookmark/`.

If you want another folder:

1. Click **One-click download install script** in Advanced Settings
2. Run `bash ~/Downloads/install-btl-native.sh`
3. Restart the browser
4. Click **Choose Folder** in Advanced Settings and select any local directory

## Cloud Provider Mode

If you don't want Claude Code mode, switch to a cloud provider (OpenAI / Claude / Kimi / Zhipu):

1. Keep `AI toggle` on and select `TLDR` mode
2. Choose summary language and provider
3. Fill:
- API Key
- Model (optional; leave blank to use default)
- Base URL (optional; blank uses official default endpoint)
4. Save settings and export

Save behavior stays the same (native write first, download fallback optional).

## Usage

1. Open a Grok chat page at `https://grok.com/`
2. Click the extension icon
3. Click `导出当前对话`
4. Done

## Project Structure

```text
grok-chat-bookmark/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.css
├── popup.js
└── native-host/
    ├── grok_file_writer.py
    └── install-macos.sh
```

## Notes

- Current target site: `https://grok.com/*`
- If Grok DOM changes, extraction rules in `content.js` may need updates
- Native Host script currently supports macOS
