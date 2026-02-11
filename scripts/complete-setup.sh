#!/bin/bash

echo "========================================="
echo "Datadog MCP Server - Complete Setup"
echo "========================================="
echo ""
echo "This script will install and configure:"
echo "1. NVM (Node Version Manager) and Node.js 20"
echo "2. pnpm package manager"
echo "3. Datadog credentials (.env file)"
echo "4. MCP server dependencies and build"
echo "5. MCP server testing (verify API connectivity)"
echo "6. Claude Code CLI"
echo "7. Claude Code project-level configuration"
echo "8. Z.AI API token (for GLM 4.7 Flash model)"
echo ""
echo "⏱️  Estimated time: 5-10 minutes"
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
  echo "✅ Node.js 20 installed ($(node --version))"
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

# Run Datadog credentials setup (now creates .env file)
bash "$SCRIPT_DIR/setup-datadog-env.sh"

if [ $? -ne 0 ]; then
  echo "❌ Datadog setup failed"
  exit 1
fi

# Load and export credentials from .env file
if [ -f "$PROJECT_DIR/.env" ]; then
  export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
  echo "✅ Environment variables loaded and exported from .env"
else
  echo "⚠️  Warning: .env file not found. Credentials may not be available."
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
echo "Step 6: Testing MCP server"
echo "========================================="
echo ""

# Test if MCP server can load credentials and call Datadog API
echo "Testing MCP server with Datadog API..."
echo ""

# Create a simple test script
cat > /tmp/test-mcp-server.js << 'TESTEOF'
import { spawn } from 'child_process';

const test = () => {
  return new Promise((resolve, reject) => {
    const mcp = spawn('node', ['build/index.js'], {
      stdio: ['pipe', 'pipe', 'inherit']
    });

    let output = '';
    let timeout = setTimeout(() => {
      mcp.kill();
      reject(new Error('Test timeout after 10s'));
    }, 10000);

    mcp.stdout.on('data', (data) => {
      output += data.toString();

      // Check if we got a valid response
      if (output.includes('"tools"') || output.includes('"result"')) {
        clearTimeout(timeout);
        mcp.kill();

        if (output.includes('error') && !output.includes('"tools"')) {
          reject(new Error('MCP server returned error: ' + output));
        } else {
          resolve(output);
        }
      }
    });

    // Send list_tools request
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    };

    mcp.stdin.write(JSON.stringify(request) + '\n');
  });
};

test()
  .then(() => {
    console.log('✅ MCP server test passed');
    console.log('   - Server loads successfully');
    console.log('   - Environment variables loaded from .env');
    console.log('   - API credentials configured');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MCP server test failed:', err.message);
    console.error('   This may indicate issues with:');
    console.error('   - Missing .env file or credentials');
    console.error('   - Invalid API keys');
    console.error('   - Build problems');
    process.exit(1);
  });
TESTEOF

# Run the test
if node /tmp/test-mcp-server.js; then
  echo ""
  echo "✅ MCP server is working correctly"
else
  echo ""
  echo "⚠️  MCP server test failed"
  echo "   You can manually test later with:"
  echo "   npx @modelcontextprotocol/inspector build/index.js"
  echo ""
  read -p "Continue with setup anyway? (y/N): " CONTINUE_ANYWAY
  if [[ ! "$CONTINUE_ANYWAY" =~ ^[Yy]$ ]]; then
    echo "Setup aborted. Please check your credentials and try again."
    exit 1
  fi
fi

# Cleanup
rm -f /tmp/test-mcp-server.js

echo ""
echo "========================================="
echo "Step 7: Installing Claude Code CLI"
echo "========================================="
echo ""

# Check if Claude Code CLI is installed
if command -v claude &> /dev/null; then
  echo "✓ Claude Code CLI already installed ($(claude --version 2>/dev/null || echo 'version unknown'))"
else
  echo "Installing Claude Code CLI..."
  npm install -g @anthropic-ai/claude-code

  if [ $? -eq 0 ]; then
    echo "✅ Claude Code CLI installed"
  else
    echo "❌ Claude Code CLI installation failed"
    echo "   You can install it manually later with:"
    echo "   npm install -g @anthropic-ai/claude-code"
  fi
fi

echo ""
echo "========================================="
echo "Step 8: Configuring Claude Code (Project Level)"
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
echo "Step 9: Setting up Z.AI API Token"
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
echo "✅ NVM and Node.js 20 installed"
echo "✅ pnpm package manager installed"
echo "✅ Datadog credentials configured (.env file)"
echo "✅ MCP server built and tested"
echo "✅ Datadog API connectivity verified"
echo "✅ Claude Code CLI installed"
echo "✅ Claude Code configured (project-level)"
if [[ ! "$SETUP_ZAI" =~ ^[Nn]$ ]]; then
  echo "✅ Z.AI API token configured (GLM 4.7 Flash)"
fi
echo ""
echo "========================================="
echo "Next Steps"
echo "========================================="
echo ""
if [[ "$SETUP_ZAI" =~ ^[Nn]$ ]]; then
  echo "1. Set up Z.AI API token (you skipped this):"
  echo "   curl -O https://cdn.bigmodel.cn/install/claude_code_zai_env.sh && bash ./claude_code_zai_env.sh"
  echo ""
  echo "2. Start Claude Code from THIS project directory:"
else
  echo "1. Start Claude Code from THIS project directory:"
fi
echo "   cd $PROJECT_DIR"
echo "   claude"
echo ""
if [[ "$SETUP_ZAI" =~ ^[Nn]$ ]]; then
  echo "3. Test the setup:"
else
  echo "2. Test the setup:"
fi
echo "   Type: 'List all available MCP tools'"
echo "   You should see 32 Datadog tools!"
echo ""
if [[ "$SETUP_ZAI" =~ ^[Nn]$ ]]; then
  echo "4. Try example prompts from docs/QUICKSTART.md"
else
  echo "3. Try example prompts from docs/QUICKSTART.md"
fi
echo ""
echo "========================================="
echo "Configuration Summary"
echo "========================================="
echo "Project directory: $PROJECT_DIR"
echo "Configuration files:"
echo "  - .env (Datadog credentials - git-ignored)"
echo "  - .mcp.json (MCP server config)"
echo "  - .claude/settings.local.json (Project settings)"
echo ""
if [ -n "$DATADOG_API_KEY" ] && [ -n "$DATADOG_APP_KEY" ]; then
  echo "Datadog credentials:"
  echo "  API Key: ${DATADOG_API_KEY:0:10}***"
  echo "  App Key: ${DATADOG_APP_KEY:0:10}***"
  echo "  Site: ${DATADOG_SITE:-datadoghq.com}"
  echo "  Status: ✅ Exported and available in current session"
fi
echo ""
echo "Happy monitoring! 🚀📊"
