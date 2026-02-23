# Privacy Policy — Grok Bookmark

**Last updated:** February 23, 2026

Grok Bookmark is a browser extension that exports conversations from grok.com to Markdown files. This policy explains what data the extension accesses and how it is handled.

## Data We Do NOT Collect

- We do **not** collect, transmit, or sell any personal data.
- We do **not** use analytics, telemetry, or tracking of any kind.
- We do **not** run any remote servers. The extension operates entirely on your device.

## Local Storage

The extension stores the following data locally on your device using Chrome's storage APIs:

- **Settings** (`chrome.storage.sync`): UI language, theme, export mode, AI provider selection, target folder name, and base folder path. These sync across your Chrome browsers if Chrome Sync is enabled.
- **Encrypted API Key** (`chrome.storage.local`): If you configure a cloud AI provider, your API key is encrypted with AES-256-GCM and stored only on the local device. It is never synced to the cloud.
- **Export History** (`chrome.storage.local`): A log of your recent exports (title, timestamp, mode, preview) stored locally. Maximum 200 entries.

## Third-Party AI API Calls

When you **explicitly choose** a cloud AI provider (OpenAI, Anthropic, Kimi, or Zhipu) and click "Export Current Chat," the conversation content is sent to that provider's API to generate a TLDR summary. This only happens:

- When you actively select a cloud provider in Settings.
- When you click the "Export" button.
- Using **your own** API key that you provide.

If you use the default "Claude Code (local)" provider, all processing happens locally on your machine with no network calls.

## Native Messaging

The optional Native Helper (`grok_file_writer.py`) communicates with the extension solely for:

- **Writing files** to a local folder you choose.
- **Invoking the local Claude CLI** for AI summaries (no network involved).
- **Picking a folder** via the macOS folder dialog.

No data leaves your machine through the native messaging channel.

## Permissions Explained

| Permission | Why It's Needed |
|---|---|
| `storage` | Save your settings and export history locally |
| `tabs` | Detect the active Grok tab for content extraction |
| `downloads` | Save exported Markdown files to your Downloads folder |
| `nativeMessaging` | Communicate with the local Native Helper for file writing |
| `offscreen` | Create download URLs in MV3 (technical requirement) |

## Contact

If you have questions about this privacy policy, please open an issue at:
https://github.com/mingyan9989/grok-chat-bookmark/issues
