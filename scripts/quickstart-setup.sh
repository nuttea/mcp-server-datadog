#!/bin/bash

echo "========================================="
echo "Datadog MCP Server - Quick Start Setup"
echo "========================================="
echo ""
echo "This script will set up:"
echo "1. Datadog credentials"
echo "2. MCP server dependencies and build"
echo "3. Claude Code project-level configuration"
echo "4. Z.AI API token (for GLM 4.7 Flash model)"
echo ""
echo "Prerequisites:"
echo "- Node.js 20+ and npm must be installed"
echo "- pnpm must be installed"
echo ""
echo "💡 For complete end-to-end setup (including NVM/Node/pnpm),"
echo "   use: bash scripts/complete-setup.sh"
echo ""
echo "⏱️  Estimated time: 3-5 minutes"
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
echo "Step 4: Setting up Z.AI API Token"
echo "========================================="
echo ""
echo "Z.AI provides FREE access to GLM 4.7 Flash model for Claude Code."
echo ""
echo "To get your API token:"
echo "1. Open: https://z.ai/manage-apikey/apikey-list"
echo "2. Create or copy your API key"
echo ""
read -p "Set up Z.AI now? (Y/n): " SETUP_ZAI

if [[ ! "$SETUP_ZAI" =~ ^[Nn]$ ]]; then
  echo ""
  echo "Opening Z.AI API key page in your browser..."

  # Try to open browser
  if command -v xdg-open &> /dev/null; then
    xdg-open "https://z.ai/manage-apikey/apikey-list" 2>/dev/null &
  elif command -v open &> /dev/null; then
    open "https://z.ai/manage-apikey/apikey-list" 2>/dev/null &
  else
    echo "Please manually open: https://z.ai/manage-apikey/apikey-list"
  fi

  echo ""
  echo "After getting your API key, the setup script will configure it..."
  echo "Press Enter to continue..."
  read

  echo ""
  echo "Downloading and running Z.AI setup script..."
  curl -O "https://cdn.bigmodel.cn/install/claude_code_zai_env.sh"

  if [ -f "claude_code_zai_env.sh" ]; then
    bash ./claude_code_zai_env.sh

    if [ $? -eq 0 ]; then
      echo "✅ Z.AI configured successfully"
      rm -f claude_code_zai_env.sh
    else
      echo "⚠️  Z.AI setup had issues. You can run it manually later:"
      echo "   curl -O https://cdn.bigmodel.cn/install/claude_code_zai_env.sh && bash ./claude_code_zai_env.sh"
    fi
  else
    echo "❌ Failed to download Z.AI setup script"
    echo "You can set it up manually later with:"
    echo "   curl -O https://cdn.bigmodel.cn/install/claude_code_zai_env.sh && bash ./claude_code_zai_env.sh"
  fi
else
  echo ""
  echo "Skipping Z.AI setup. You can set it up later with:"
  echo "   curl -O https://cdn.bigmodel.cn/install/claude_code_zai_env.sh && bash ./claude_code_zai_env.sh"
fi

echo ""
echo "========================================="
echo "Setup Complete! 🎉"
echo "========================================="
echo ""
echo "✅ Datadog credentials configured"
echo "✅ MCP server built"
echo "✅ Claude Code configured (project-level)"
if [[ ! "$SETUP_ZAI" =~ ^[Nn]$ ]]; then
  echo "✅ Z.AI API token configured (GLM 4.7 Flash)"
fi
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
if [[ "$SETUP_ZAI" =~ ^[Nn]$ ]]; then
  echo "2. Set up Z.AI API token (you skipped this):"
  echo "   Get API key: https://z.ai/manage-apikey/apikey-list"
  echo "   Run: curl -O https://cdn.bigmodel.cn/install/claude_code_zai_env.sh && bash ./claude_code_zai_env.sh"
  echo ""
  echo "3. Start Claude Code from THIS project directory:"
else
  echo "2. Start Claude Code from THIS project directory:"
fi
echo "   cd $PROJECT_DIR"
echo "   claude"
echo ""
if [[ "$SETUP_ZAI" =~ ^[Nn]$ ]]; then
  echo "4. Test the setup:"
else
  echo "3. Test the setup:"
fi
echo "   Type: 'List all available MCP tools'"
echo "   You should see 32 Datadog tools!"
echo ""
if [[ "$SETUP_ZAI" =~ ^[Nn]$ ]]; then
  echo "5. Try example prompts from docs/QUICKSTART.md"
else
  echo "4. Try example prompts from docs/QUICKSTART.md"
fi
echo ""
echo "Happy monitoring! 🚀📊"
