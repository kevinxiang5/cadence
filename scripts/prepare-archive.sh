#!/bin/zsh
set -euo pipefail

# Prepare a Release Archive. Do not start Metro — Archive embeds JS.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -x "$HOME/.homebrew/Library/Homebrew/vendor/portable-ruby/current/bin/ruby" ]; then
  export PATH="$HOME/.homebrew/Library/Homebrew/vendor/portable-ruby/current/bin:$PATH"
fi
export GEM_HOME="${GEM_HOME:-$HOME/.local/share/gems}"
export GEM_PATH="$GEM_HOME"
export PATH="$GEM_HOME/bin:$PATH"

STABLE_NODE="$HOME/.local/share/fnm/node-versions/v24.19.0/installation/bin/node"
if [ -x "$STABLE_NODE" ]; then
  printf 'export NODE_BINARY=%q\n' "$STABLE_NODE" > ios/.xcode.env.local
  echo "NODE_BINARY → $STABLE_NODE"
else
  NODE="$(command -v node)"
  printf 'export NODE_BINARY=%q\n' "$NODE" > ios/.xcode.env.local
  echo "NODE_BINARY → $NODE"
fi

if [ ! -d ios/Cadence.xcworkspace ]; then
  echo "Missing ios/Cadence.xcworkspace. Run: npm run ios:xcode" >&2
  exit 1
fi

echo
echo "Ready to Archive. In Xcode:"
echo "  1. Scheme: Cadence"
echo "  2. Destination: Any iOS Device (arm64)   ← not a simulator"
echo "  3. Product → Archive"
echo "  4. Organizer → Distribute App → App Store Connect"
echo
echo "This is a Release build. JS is embedded. No Metro. No “script URL” screen."
echo

open ios/Cadence.xcworkspace
