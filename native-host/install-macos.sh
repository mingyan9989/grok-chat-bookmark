#!/bin/bash
set -e

HOST_NAME="com.grok.bookmark_writer"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOST_PATH="$SCRIPT_DIR/grok_file_writer.py"

if [ -z "$1" ]; then
  echo "用法: ./install-macos.sh <扩展ID>"
  echo "扩展 ID 可在 chrome://extensions 开启开发者模式后查看。"
  exit 1
fi

EXT_ID="$1"
chmod +x "$HOST_PATH"

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
  echo "No Chromium browser detected."
  exit 1
fi

echo "完成。请重启浏览器。"
