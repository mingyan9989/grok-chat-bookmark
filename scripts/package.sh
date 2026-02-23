#!/bin/bash
set -e

cd "$(dirname "$0")/.."

VERSION=$(grep '"version"' manifest.json | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
OUTFILE="grok-bookmark-v${VERSION}.zip"

rm -f "$OUTFILE"

zip -r "$OUTFILE" \
  manifest.json \
  background.js \
  content.js content.css \
  popup.html popup.js popup.css \
  offscreen.html offscreen.js \
  icons/ \
  fonts/ \
  -x "*.DS_Store" "__pycache__/*"

echo "Created $OUTFILE ($(du -h "$OUTFILE" | cut -f1))"
