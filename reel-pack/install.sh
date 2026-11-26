#!/usr/bin/env bash
# Reel Pack installer (macOS / Linux / Git Bash on Windows).
#   ./install.sh                 set up the pack in this folder (installs the kit's npm packages)
#   ./install.sh /path/to/folder copy the pack into another folder (e.g. an existing project) and set it up there
set -euo pipefail
SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="${1:-$SRC}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing: $1. $2"; exit 1; }; }
need node   "Install Node.js 18+ from https://nodejs.org"
need npm    "Install Node.js 18+ from https://nodejs.org"
need ffmpeg "Install ffmpeg (macOS: brew install ffmpeg | Windows: winget install Gyan.FFmpeg | Linux: apt install ffmpeg)"

if [ "$DEST" != "$SRC" ]; then
  mkdir -p "$DEST"
  for item in CLAUDE.md README.md LICENSE THIRD-PARTY-NOTICES.md .claude knowledge kit tools projects; do
    if [ -e "$DEST/$item" ] && [ "$item" = "CLAUDE.md" ]; then
      echo "Note: $DEST/CLAUDE.md exists; writing the pack's version to CLAUDE.reel-pack.md (merge it in yourself)."
      cp "$SRC/CLAUDE.md" "$DEST/CLAUDE.reel-pack.md"; continue
    fi
    if [ "$item" = "kit" ]; then
      mkdir -p "$DEST/kit"; (cd "$SRC/kit" && tar --exclude=node_modules --exclude=out -cf - .) | (cd "$DEST/kit" && tar -xf -)
    else
      cp -R "$SRC/$item" "$DEST/"
    fi
  done
  echo "Copied the pack into $DEST"
fi

echo "Installing the kit (Remotion + three.js). First time takes a minute or two..."
(cd "$DEST/kit" && npm install --no-audit --no-fund)

PY=""
for c in python3 python py; do   # on Windows "python3" can be a Store stub that does nothing: test each one
  if command -v "$c" >/dev/null 2>&1 && "$c" -c "import sys" >/dev/null 2>&1; then PY="$c"; break; fi
done
if [ -n "$PY" ]; then
  "$PY" -c "import numpy" 2>/dev/null && "$PY" "$DEST/tools/make_sfx.py" "$DEST/kit/public/sfx" >/dev/null && echo "SFX library ready." \
    || echo "Optional: pip install -r tools/requirements.txt (for the check tools and SFX synth). Starter SFX are already included."
else
  echo "Optional: install Python 3.10+ and run: pip install -r tools/requirements.txt (check tools)."
fi

echo
echo "Done. Open Claude Code in: $DEST"
echo "Then try:  make a 6-second 9:16 animation of a tank firing, using the reel pack"
echo "       or:  make a 10-second myth-style scene: a man drops a bowling ball and a feather. Which lands first?"
