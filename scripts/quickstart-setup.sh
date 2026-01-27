#!/bin/bash

echo "========================================="
echo "Datadog MCP Server - Quick Start Setup"
echo "========================================="
echo ""
echo "This script will set up:"
echo "1. Datadog credentials"
echo "2. Claude Code MCP server configuration"
echo ""
read -p "Continue? (y/N): " CONTINUE
if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
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
echo "Step 3: Configuring Claude Code"
echo "========================================="
echo ""

# Run Claude Code MCP setup
bash "$SCRIPT_DIR/setup-claude-mcp.sh"

if [ $? -ne 0 ]; then
  echo "❌ Claude Code setup failed"
  exit 1
fi

echo ""
echo "========================================="
echo "Setup Complete! 🎉"
echo "========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. If you haven't set up Z.AI yet, run:"
echo "   curl -O https://cdn.bigmodel.cn/install/claude_code_zai_env.sh && bash ./claude_code_zai_env.sh"
echo ""
echo "2. Start Claude Code:"
echo "   claude"
echo ""
echo "3. Test with: 'List all available MCP tools'"
echo "   You should see 32 Datadog tools!"
echo ""
echo "4. Try example prompts from QUICKSTART.md"
echo ""
echo "Happy monitoring! 🚀"
