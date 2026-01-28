#!/bin/bash

echo "========================================="
echo "Datadog MCP Server - Quick Start Setup"
echo "========================================="
echo ""
echo "This script will set up:"
echo "1. Datadog credentials"
echo "2. MCP server dependencies and build"
echo "3. Claude Code project-level configuration"
echo ""
echo "Prerequisites:"
echo "- Node.js 20+ and npm must be installed"
echo "- pnpm must be installed"
echo ""
echo "💡 For complete end-to-end setup (including NVM/Node/pnpm),"
echo "   use: bash scripts/complete-setup.sh"
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
echo "Step 1: Setting up Datadog credentials"
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
echo "Step 2: Building MCP server"
echo "========================================="
echo ""

cd "$PROJECT_DIR"

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
  echo "❌ pnpm not found. Please install pnpm first:"
  echo "   npm install -g pnpm"
  exit 1
fi

# Install dependencies if node_modules doesn't exist or is empty
if [ ! -d "$PROJECT_DIR/node_modules" ] || [ -z "$(ls -A "$PROJECT_DIR/node_modules" 2>/dev/null)" ]; then
  echo "Installing dependencies..."
  pnpm install
  if [ $? -ne 0 ]; then
    echo "❌ Dependency installation failed"
    exit 1
  fi
  echo "✅ Dependencies installed"
fi

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
  echo "✅ MCP server already built"
fi

echo ""
echo "========================================="
echo "Step 3: Configuring Claude Code (Project Level)"
echo "========================================="
echo ""

# Run Project-level Claude Code MCP setup
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
echo "✅ Datadog credentials configured"
echo "✅ MCP server built"
echo "✅ Claude Code configured (project-level)"
echo ""
echo "Configuration files created:"
echo "  - $PROJECT_DIR/.mcp.json"
echo "  - $PROJECT_DIR/.claude/settings.local.json"
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
echo "Happy monitoring! 🚀📊"
