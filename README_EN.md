# Grok Bookmark

> A Chrome extension that exports the current Grok conversation to Markdown with one click, and saves it to your Claude Code folder by default.

[中文](README.md) | English

## Features

- One-click export from the current Grok chat page
- Structured TLDR in AI mode: `Key Points / Step-by-Step / Fact Check(1-10) / Open Questions`
- Claude Code flow by default (local Claude CLI, no API key required)
- Optional custom API mode (`API Endpoint + API Key + Model`)
- Custom base folder (Claude Code root)
- Custom subfolder name (default: `grok bookmark`)
- Download fallback when native write fails

## Installation

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select: `/Users/mingyan/Grok download/grok-chat-bookmark`

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
cd "/Users/mingyan/Grok download/grok-chat-bookmark/native-host"
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

`folderName` defaults to `grok bookmark`.

## Custom API Mode

If you don't want to use Claude Code mode, switch to `Custom API Key`:

1. Change provider to `custom-api`
2. Fill:
- API Endpoint
- API Key
- Model
3. Save settings and export

Note: custom API is used for markdown polishing. Save behavior stays the same (native write first, download fallback optional).

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
