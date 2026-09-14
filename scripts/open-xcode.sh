#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Homebrew's portable Ruby can install gems. System Ruby 2.6 cannot.
if [ -x "$HOME/.homebrew/Library/Homebrew/vendor/portable-ruby/current/bin/ruby" ]; then
  export PATH="$HOME/.homebrew/Library/Homebrew/vendor/portable-ruby/current/bin:$PATH"
fi

export GEM_HOME="${GEM_HOME:-$HOME/.local/share/gems}"
export GEM_PATH="$GEM_HOME"
export PATH="$GEM_HOME/bin:$PATH"

if ! command -v pod >/dev/null 2>&1; then
  echo "Installing CocoaPods locally…"
  mkdir -p "$GEM_HOME"
  gem install cocoapods --no-document
fi

if [ ! -d ios/Cadence.xcodeproj ]; then
  echo "Generating the iOS project…"
  npx expo prebuild --platform ios --no-install
fi

# Xcode scripts need a real node binary, not an fnm shell shim.
STABLE_NODE="$HOME/.local/share/fnm/node-versions/v24.19.0/installation/bin/node"
if [ -x "$STABLE_NODE" ]; then
  printf 'export NODE_BINARY=%q\n' "$STABLE_NODE" > ios/.xcode.env.local
fi

echo "Installing iOS native libraries (pod install)…"
(cd ios && pod install)

if [ ! -d ios/Cadence.xcworkspace ]; then
  echo "pod install did not create Cadence.xcworkspace" >&2
  exit 1
fi

# Debug Run in Xcode does not embed JS — it loads from Metro.
if curl -sf http://127.0.0.1:8081/status >/dev/null 2>&1; then
  echo "Metro already running on 8081."
else
  echo "Starting Metro (required for Xcode Debug Run)…"
  npx expo start --port 8081 >/tmp/cadence-metro.log 2>&1 &
  for _ in {1..40}; do
    curl -sf http://127.0.0.1:8081/status >/dev/null 2>&1 && break
    sleep 0.5
  done
  if curl -sf http://127.0.0.1:8081/status >/dev/null 2>&1; then
    echo "Metro is ready."
  else
    echo "Metro did not come up. Check /tmp/cadence-metro.log, then run: npm start" >&2
  fi
fi

echo "Opening Cadence in Xcode…"
open ios/Cadence.xcworkspace
