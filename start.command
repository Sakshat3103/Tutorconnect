#!/bin/zsh -l
# Starts TutorConnect on http://localhost:3000
cd "$(dirname "$0")"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
[ -s "$HOME/.nvm/nvm.sh" ] && source "$HOME/.nvm/nvm.sh"
if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js is not installed. Install the LTS version from https://nodejs.org and run this again."
  read "?Press Enter to close..."; exit 1
fi
echo "Using Node $(node -v)"
if [ ! -d node_modules/better-sqlite3 ]; then
  echo "Installing packages (first time only)..."
  npm install || { read "?npm install failed. Press Enter to close..."; exit 1; }
fi
(sleep 8; open http://localhost:3000) &
npm run dev
