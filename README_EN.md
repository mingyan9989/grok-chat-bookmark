# Grok Bookmark

> A Chrome extension that exports the current Grok conversation to Markdown with one click, and saves it to your Claude Code folder by default.

[中文](README.md) | English

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

## Cloud Provider Mode

If you don't want Claude Code mode, switch to a cloud provider (OpenAI / Claude / Kimi / Zhipu):

1. Keep `AI toggle` on and select `TLDR` mode
2. Choose provider
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
