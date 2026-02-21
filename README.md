# Grok Bookmark

A Chrome extension that exports the current Grok conversation to Markdown with one click, and saves it to your Claude Code folder by default.

## English

### Key Highlights

- One-click export of the current Grok conversation to Markdown.
- Supports TLDR summary mode and original-content mode.
- Supports local Claude Code and cloud providers (OpenAI / Claude / Kimi / Zhipu).
- Supports multilingual summaries (zh-CN / zh-TW / English / Japanese / Korean).
- Supports popup UI language switch (Chinese / English).
- Supports theme modes (Auto / Light / Dark) for popup and export cards.
- Supports custom save path via Native Helper (default: `Downloads/grok-chat-bookmark/`).
- API keys are encrypted with AES-GCM in local storage and never synced.

### Features

- One-click export from the current Grok chat page.
- Structured TLDR in AI mode: `Key Points / Step-by-Step / Fact Check (1-10) / Open Questions`.
- AI toggle (enabled by default) to disable summarization instantly.
- Original mode to save raw conversation + metadata without AI TLDR.
- Custom Base URL support for proxy/private gateway routing.
- Deep extraction: auto-expands collapsed content such as "Show more" before export.
- Card stacking: consecutive exports show stacked result cards at bottom-right.
- History: exports are saved and viewable in the popup History tab.
- Markdown archive includes TLDR + original conversation with metadata/referenced links.

### Installation

1. Open `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select your local `grok-chat-bookmark` project folder.

### Default Workflow (Recommended)

Default mode is `Claude Code` and does not require an API key.

1. Install Claude Code CLI:

```bash
npm install -g @anthropic-ai/claude-code
claude login
```

2. Install Native Host (one-time):

```bash
cd "<your-project-path>/grok-chat-bookmark/native-host"
bash install-macos.sh <your-extension-id>
```

3. Restart browser.
4. Open a Grok conversation page.
5. Click extension icon -> **Export Current Chat**.

Output path:

```text
<selected-root>/<folderName>/<timestamp>_<title>.md
```

Default `folderName`: `grok-chat-bookmark`.

### Custom Save Path (Optional)

By default, files are saved to `Downloads/grok-chat-bookmark/`.

To use another folder:

1. Click **One-click download install script** in Advanced Settings.
2. Run `bash ~/Downloads/install-btl-native.sh`.
3. Restart browser.
4. Click **Choose Folder** in Advanced Settings.

### Cloud Provider Mode

If you don't want Claude Code mode, switch to cloud provider mode:

1. Keep `AI toggle` on and select `TLDR` mode.
2. Choose summary language and provider.
3. Fill API Key and optional Model/Base URL.
4. Save settings and export.

### Project Structure

```text
grok-chat-bookmark/
├── manifest.json
├── background.js
├── content.js
├── content.css
├── popup.html
├── popup.css
├── popup.js
├── icons/
└── native-host/
    ├── grok_file_writer.py
    └── install-macos.sh
```

---

## 中文

### 核心亮点

- 一键导出 Grok 当前对话为 Markdown。
- 支持 TLDR 摘要模式与原文模式。
- 支持本地 Claude Code 与云模型（OpenAI / Claude / Kimi / 智谱）。
- 支持多语言摘要（简中 / 繁中 / English / 日本語 / 한국어）。
- 支持弹窗界面语言切换（中文 / English）。
- 支持主题模式（自动 / 浅色 / 深色），覆盖弹窗与导出卡片。
- 支持通过 Native Helper 自定义保存路径（默认：`Downloads/grok-chat-bookmark/`）。
- API Key 使用 AES-GCM 在本地加密存储，不会同步。

### 功能特点

- 在 Grok 对话页一键导出当前对话。
- AI 模式下自动生成结构化 TLDR：`Key Points / Step-by-Step / Fact Check (1-10) / Open Questions`。
- AI 开关默认开启，可一键关闭摘要。
- 原文模式可跳过 AI 摘要，仅保存原文 + 元数据。
- 支持自定义 Base URL（代理/私有网关）。
- 深度提取：导出前自动展开“Show more / 显示更多”等折叠内容。
- 卡片堆叠：连续导出时，页面右下角卡片可叠加显示。
- 历史记录：导出结果自动保存，可在弹窗历史页回看。
- Markdown 归档包含 TLDR、原文、Metadata 与 Referenced Links。

### 安装

1. 打开 `chrome://extensions/`。
2. 开启右上角 **开发者模式**。
3. 点击 **加载已解压的扩展程序**。
4. 选择你本地的 `grok-chat-bookmark` 项目目录。

### 默认流程（推荐）

默认模式为 `Claude Code`，无需 API Key。

1. 安装 Claude Code CLI：

```bash
npm install -g @anthropic-ai/claude-code
claude login
```

2. 安装 Native Host（一次即可）：

```bash
cd "<你的项目目录>/grok-chat-bookmark/native-host"
bash install-macos.sh <你的扩展ID>
```

3. 重启浏览器。
4. 打开任意 Grok 对话页面。
5. 点击扩展图标 -> **导出当前对话**。

输出路径：

```text
<你选择的目录>/<folderName>/<timestamp>_<title>.md
```

默认 `folderName` 为 `grok-chat-bookmark`。

### 自定义保存路径（可选）

默认保存到 `Downloads/grok-chat-bookmark/`。

如需保存到其他目录：

1. 在高级设置点击 **一键下载安装脚本**。
2. 运行 `bash ~/Downloads/install-btl-native.sh`。
3. 重启浏览器。
4. 在高级设置点击 **选择文件夹**。

### 云模型模式

如果不使用 Claude Code，可切换云模型模式：

1. 保持 `AI 开关` 开启，并选择 `TLDR` 模式。
2. 选择摘要语言与模型提供方。
3. 填写 API Key，Model/Base URL 可选。
4. 保存设置并导出。

### 项目结构

```text
grok-chat-bookmark/
├── manifest.json
├── background.js
├── content.js
├── content.css
├── popup.html
├── popup.css
├── popup.js
├── icons/
└── native-host/
    ├── grok_file_writer.py
    └── install-macos.sh
```
