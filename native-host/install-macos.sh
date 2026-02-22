#!/bin/bash
set -e

HOST_NAME="com.grok.chat_bookmark_writer"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOST_PATH="$SCRIPT_DIR/grok_file_writer.py"

if [ -z "$1" ]; then
  echo "Usage: ./install-macos.sh <extension-id>"
  echo "Find your extension ID at chrome://extensions (enable Developer Mode)."
  exit 1
fi

EXT_ID="$1"

# ── Check macOS ──
if [ "$(uname -s)" != "Darwin" ]; then
  echo "Error: This script only supports macOS."
  exit 1
fi

# ── Check Python 3 ──
if ! command -v python3 &>/dev/null; then
  echo "Error: Python 3 is required but not found."
  echo "  Install via:  brew install python3"
  exit 1
fi

if [ ! -f "$HOST_PATH" ]; then
  echo "Error: $HOST_PATH not found."
  exit 1
fi

chmod +x "$HOST_PATH"

# ── Install native host manifest ──
BROWSER_DIRS=(
  "$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
  "$HOME/Library/Application Support/Google/Chrome Beta/NativeMessagingHosts"
  "$HOME/Library/Application Support/Google/Chrome Canary/NativeMessagingHosts"
  "$HOME/Library/Application Support/Chromium/NativeMessagingHosts"
  "$HOME/Library/Application Support/BraveSoftware/Brave-Browser/NativeMessagingHosts"
  "$HOME/Library/Application Support/Microsoft Edge/NativeMessagingHosts"
)

count=0
for dir in "${BROWSER_DIRS[@]}"; do
  parent="$(dirname "$dir")"
  if [ -d "$parent" ]; then
    mkdir -p "$dir"
    cat > "$dir/$HOST_NAME.json" <<MANIFEST
{
  "name": "$HOST_NAME",
  "description": "File writer for Grok Bookmark extension",
  "path": "$HOST_PATH",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://$EXT_ID/"]
}
MANIFEST
    echo "Installed: $dir/$HOST_NAME.json"
    count=$((count + 1))
  fi
done

if [ "$count" -eq 0 ]; then
  echo "No supported Chromium browser detected."
  exit 1
fi

echo "Done. Please restart your browser."
