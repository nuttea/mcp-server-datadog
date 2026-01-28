#!/bin/bash

echo "========================================="
echo "Datadog MCP Server - Complete Setup"
echo "========================================="
echo ""
echo "This script will install and configure:"
echo "1. NVM (Node Version Manager)"
echo "2. Node.js 20"
echo "3. pnpm package manager"
echo "4. Datadog credentials"
echo "5. MCP server dependencies and build"
echo "6. Claude Code project-level configuration"
echo ""
read -p "Continue? (Y/n): " CONTINUE
if [[ "$CONTINUE" =~ ^[Nn]$ ]]; then
  echo "Aborted."
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo ""
echo "========================================="
echo "Step 1: Installing NVM and Node.js 20"
echo "========================================="
echo ""

# Check if NVM is installed
if [ ! -d "$HOME/.nvm" ]; then
  echo "Installing NVM..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

  # Load NVM
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

  echo "✅ NVM installed"
else
  echo "✓ NVM already installed"

  # Load NVM
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Check if Node 20 is installed
if ! command -v node &> /dev/null || ! node --version | grep -q "^v20"; then
  echo "Installing Node.js 20..."
  nvm install 20
  nvm use 20
  nvm alias default 20
  echo "✅ Node.js 20 installed"
else
  echo "✓ Node.js 20 already installed ($(node --version))"
fi

echo ""
echo "========================================="
echo "Step 2: Installing pnpm"
echo "========================================="
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
  echo "Installing pnpm..."
  npm install -g pnpm
  echo "✅ pnpm installed"
else
  echo "✓ pnpm already installed ($(pnpm --version))"
fi

echo ""
echo "========================================="
echo "Step 3: Setting up Datadog credentials"
echo "========================================="
echo ""

# Run Datadog credentials setup
bash "$SCRIPT_DIR/setup-datadog-env.sh"

if [ $? -ne 0 ]; then
  echo "❌ Datadog setup failed"
  exit 1
fi

# Source the shell config to load credentials
if [ -f "$HOME/.zshrc" ]; then
  source "$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
  source "$HOME/.bashrc"
fi

echo ""
echo "========================================="
echo "Step 4: Installing dependencies"
echo "========================================="
echo ""

cd "$PROJECT_DIR"

# Install dependencies
if [ ! -d "$PROJECT_DIR/node_modules" ] || [ -z "$(ls -A "$PROJECT_DIR/node_modules" 2>/dev/null)" ]; then
  echo "Installing project dependencies..."
  pnpm install
  if [ $? -ne 0 ]; then
    echo "❌ Dependency installation failed"
    exit 1
  fi
  echo "✅ Dependencies installed"
else
  echo "✓ Dependencies already installed"
fi

echo ""
echo "========================================="
echo "Step 5: Building MCP server"
echo "========================================="
echo ""

# Build if needed
if [ ! -f "$PROJECT_DIR/build/index.js" ]; then
  echo "Building MCP server..."
  pnpm build

  if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
  fi
  echo "✅ Build successful"
else
  echo "✓ MCP server already built"
fi

echo ""
echo "========================================="
echo "Step 6: Configuring Claude Code (Project Level)"
echo "========================================="
echo ""

# Run project-level Claude Code MCP setup
bash "$SCRIPT_DIR/setup-project-mcp.sh"

if [ $? -ne 0 ]; then
  echo "❌ Claude Code setup failed"
  exit 1
fi

echo ""
echo "========================================="
echo "Setup Complete! 🎉"
echo "========================================="
echo ""
echo "✅ NVM and Node.js 20 installed"
echo "✅ pnpm package manager installed"
echo "✅ Datadog credentials configured"
echo "✅ MCP server built"
echo "✅ Claude Code configured (project-level)"
echo ""
echo "========================================="
echo "Next Steps"
echo "========================================="
echo ""
echo "1. Install Claude Code CLI (if not installed):"
echo "   npm install -g @anthropic/claude-code"
echo ""
echo "2. Set up Z.AI API token:"
echo "   curl -O https://cdn.bigmodel.cn/install/claude_code_zai_env.sh && bash ./claude_code_zai_env.sh"
echo ""
echo "3. Start Claude Code from THIS project directory:"
echo "   cd $PROJECT_DIR"
echo "   claude"
echo ""
echo "4. Test the setup:"
echo "   Type: 'List all available MCP tools'"
echo "   You should see 32 Datadog tools!"
echo ""
echo "5. Try example prompts from docs/QUICKSTART.md"
echo ""
echo "========================================="
echo "Configuration Summary"
echo "========================================="
echo "Project directory: $PROJECT_DIR"
echo "Configuration files:"
echo "  - .mcp.json (MCP server config)"
echo "  - .claude/settings.local.json (Project settings)"
echo ""
echo "Datadog credentials:"
echo "  API Key: ${DATADOG_API_KEY:0:10}***"
echo "  App Key: ${DATADOG_APP_KEY:0:10}***"
echo "  Site: ${DATADOG_SITE:-datadoghq.com}"
echo ""
echo "Happy monitoring! 🚀📊"
