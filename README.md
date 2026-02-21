# Grok Bookmark

> 一个 Chrome 扩展：点击一次按钮，把当前 Grok 对话导出为 Markdown，并优先保存到你的 Claude Code 目录。

中文 | [English](README_EN.md)

## 功能特点

- 一键导出：在 Grok 对话页点击扩展按钮，立即导出当前对话
- 结构化 TLDR：AI 模式下自动生成 `Key Points / Step-by-Step / Fact Check(1-10) / Open Questions`
- AI 开关：默认开启，可一键关闭 AI 摘要
- 原文模式：可切换为仅保存原文 + 元数据（跳过 AI 摘要）
- 默认 Claude Code 流程：默认使用本地 Claude Code CLI（无需 API Key）
- 可选自定义 API：支持填写 `API Endpoint + API Key + Model`
- 自定义目录：可指定 Claude Code 根目录
- 自定义子文件夹名：默认 `grok bookmark`，可改成任何名字
- 失败回退：本地写入失败时可自动回退到浏览器下载

## 安装

1. 打开 Chrome 扩展页：`chrome://extensions/`
2. 打开右上角 **开发者模式**
3. 点击 **加载已解压的扩展程序**
4. 选择目录：`/Users/mingyan/Grok download/grok-chat-bookmark`

## 默认模式（推荐）

默认模式是 `Claude Code（默认）`，不需要 API Key。

### 1) 安装 Claude Code CLI

```bash
npm install -g @anthropic-ai/claude-code
claude login
```

### 2) 安装 Native Host（只需一次）

1. 在 `chrome://extensions/` 找到这个扩展，复制扩展 ID
2. 在终端执行：

```bash
cd "/Users/mingyan/Grok download/grok-chat-bookmark/native-host"
bash install-macos.sh <你的扩展ID>
```

3. 重启浏览器

### 3) 首次导出

1. 打开任意 Grok 对话页面
2. 点击扩展图标
3. 点 `导出当前对话`
4. 首次会弹出目录选择器，选择你的 Claude Code 根目录
5. 文件会保存到：

```text
<你选的目录>/<folderName>/<timestamp>_<title>.md
```

其中 `folderName` 默认是 `grok bookmark`。

## 自定义 API 模式

如果不走 Claude Code，可切换到 `自定义 API Key`：

1. 在弹窗把导出模式改成 `自定义 API Key`
2. 填写：
- API Endpoint（默认 OpenAI Chat Completions 地址）
- API Key
- Model
3. 保存设置后导出

说明：自定义 API 只负责润色 Markdown，最终保存路径逻辑不变（优先本地写入，失败可回退下载）。

## 使用流程

1. 打开 `https://grok.com/` 的对话页面
2. 点击扩展图标
3. 点击 `导出当前对话`
4. 完成

## 项目结构

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

## 注意事项

- 本扩展当前针对 `https://grok.com/*`
- 若 Grok 页面 DOM 结构变化，可能需要更新 `content.js` 的提取规则
- Native Host 当前脚本为 macOS 方案
