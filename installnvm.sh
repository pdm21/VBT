#!/bin/bash

echo "Starting script for installation of nvm / npm related environments"

# Exit if any command fails
set -e

# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Check if nvm is available
if ! command -v nvm &> /dev/null; then
  echo "❌ nvm command not found after installation. Exiting."
  exit 1
fi

# Show version
nvm -v

# Install and use specific Node.js version
nvm install 20.18.3
nvm use 20.18.3

# Update npm and install dependencies
npm install -g npm@10.8.2
npm install

# Install frontend dependencies
cd frontend && npm install

echo "✅ All installations complete"
