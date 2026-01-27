#!/bin/bash

echo "==================================="
echo "Project-Level MCP Configuration"
echo "==================================="
echo ""

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"

echo "Project directory: $PROJECT_DIR"
echo ""

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
  echo "❌ pnpm not found. Please install: npm install -g pnpm"
  exit 1
fi

# Install dependencies if needed
if [ ! -d "$PROJECT_DIR/node_modules" ] || [ -z "$(ls -A "$PROJECT_DIR/node_modules" 2>/dev/null)" ]; then
  echo "Installing dependencies..."
  pnpm install
  if [ $? -ne 0 ]; then
    echo "❌ Dependency installation failed"
    exit 1
  fi
  echo "✓ Dependencies installed"
fi

# Check if MCP server is built
if [ ! -f "$PROJECT_DIR/build/index.js" ]; then
  echo "Building MCP server..."
  pnpm build
  if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
  fi
  echo "✓ Build successful"
else
  echo "✓ MCP server build found"
fi

echo ""

# Verify Datadog credentials
if [ -z "$DATADOG_API_KEY" ] || [ -z "$DATADOG_APP_KEY" ]; then
  echo "⚠️  Warning: Datadog credentials not found in environment"
  echo ""
  echo "Please set up credentials first:"
  echo "  bash scripts/setup-datadog-env.sh"
  echo ""
  echo "Or export them manually:"
  echo "  export DATADOG_API_KEY=\"your_key_here\""
  echo "  export DATADOG_APP_KEY=\"your_app_key_here\""
  echo "  export DATADOG_SITE=\"datadoghq.com\""
  echo ""
  read -p "Continue without credentials? (y/N): " CONTINUE
  if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
    echo "Aborted. Please set up credentials first."
    exit 0
  fi
else
  echo "✓ Found Datadog credentials:"
  echo "  API Key: ${DATADOG_API_KEY:0:10}***"
  echo "  App Key: ${DATADOG_APP_KEY:0:10}***"
  echo "  Site: ${DATADOG_SITE:-datadoghq.com}"
  echo ""
fi

# Check if run-with-node20.sh exists
if [ ! -f "$PROJECT_DIR/scripts/run-with-node20.sh" ]; then
  echo "❌ run-with-node20.sh not found"
  exit 1
fi

# Create .mcp.json
echo "Creating .mcp.json..."

# Check if .mcp.json already exists
if [ -f "$PROJECT_DIR/.mcp.json" ]; then
  echo ""
  echo "⚠️  .mcp.json already exists"
  read -p "Overwrite? (y/N): " OVERWRITE
  if [[ ! "$OVERWRITE" =~ ^[Yy]$ ]]; then
    echo "Skipping .mcp.json creation"
  else
    # Backup existing
    cp "$PROJECT_DIR/.mcp.json" "$PROJECT_DIR/.mcp.json.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✓ Backed up existing .mcp.json"

    # Create new .mcp.json
    cat > "$PROJECT_DIR/.mcp.json" <<EOF
{
  "mcpServers": {
    "datadog-local-mcp": {
      "command": "$PROJECT_DIR/scripts/run-with-node20.sh",
      "env": {
        "DATADOG_API_KEY": "\${DATADOG_API_KEY}",
        "DATADOG_APP_KEY": "\${DATADOG_APP_KEY}",
        "DATADOG_SITE": "\${DATADOG_SITE}"
      }
    }
  }
}
EOF
    echo "✓ Created .mcp.json"
  fi
else
  # Create new .mcp.json
  cat > "$PROJECT_DIR/.mcp.json" <<EOF
{
  "mcpServers": {
    "datadog-local-mcp": {
      "command": "$PROJECT_DIR/scripts/run-with-node20.sh",
      "env": {
        "DATADOG_API_KEY": "\${DATADOG_API_KEY}",
        "DATADOG_APP_KEY": "\${DATADOG_APP_KEY}",
        "DATADOG_SITE": "\${DATADOG_SITE}"
      }
    }
  }
}
EOF
  echo "✓ Created .mcp.json"
fi

# Create .claude directory if it doesn't exist
mkdir -p "$PROJECT_DIR/.claude"

# Create or update .claude/settings.local.json
echo "Creating .claude/settings.local.json..."

if [ -f "$PROJECT_DIR/.claude/settings.local.json" ]; then
  echo ""
  echo "⚠️  .claude/settings.local.json already exists"
  read -p "Overwrite? (y/N): " OVERWRITE
  if [[ ! "$OVERWRITE" =~ ^[Yy]$ ]]; then
    echo "Skipping .claude/settings.local.json creation"
  else
    # Backup existing
    cp "$PROJECT_DIR/.claude/settings.local.json" "$PROJECT_DIR/.claude/settings.local.json.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✓ Backed up existing settings.local.json"

    # Create new settings
    cat > "$PROJECT_DIR/.claude/settings.local.json" <<EOF
{
  "env": {
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.7-flash",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7-flash",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.7-flash"
  },
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": ["datadog-local-mcp"]
}
EOF
    echo "✓ Created .claude/settings.local.json"
  fi
else
  # Create new settings
  cat > "$PROJECT_DIR/.claude/settings.local.json" <<EOF
{
  "env": {
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.7-flash",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7-flash",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.7-flash"
  },
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": ["datadog-local-mcp"]
}
EOF
  echo "✓ Created .claude/settings.local.json"
fi

echo ""
echo "==================================="
echo "Configuration Summary"
echo "==================================="
echo "Project: $PROJECT_DIR"
echo "MCP Config: .mcp.json"
echo "Claude Config: .claude/settings.local.json"
echo "MCP Server: scripts/run-with-node20.sh"
echo "Model: glm-4.7-flash"
echo "Datadog API Key: ${DATADOG_API_KEY:0:10}***"
echo "Datadog App Key: ${DATADOG_APP_KEY:0:10}***"
echo "Datadog Site: ${DATADOG_SITE:-not set}"
echo ""

# Validate JSON files
echo "Validating configuration files..."
if command -v jq &> /dev/null; then
  if jq empty "$PROJECT_DIR/.mcp.json" 2>/dev/null; then
    echo "✅ .mcp.json is valid JSON"
  else
    echo "❌ .mcp.json has JSON errors!"
  fi

  if jq empty "$PROJECT_DIR/.claude/settings.local.json" 2>/dev/null; then
    echo "✅ .claude/settings.local.json is valid JSON"
  else
    echo "❌ .claude/settings.local.json has JSON errors!"
  fi
else
  echo "⚠️  jq not installed, skipping JSON validation"
fi

echo ""
echo "==================================="
echo "Next Steps"
echo "==================================="
echo "1. Make sure Datadog credentials are set:"
echo "   bash scripts/setup-datadog-env.sh"
echo ""
echo "2. Set up Z.AI API token (if not done):"
echo "   curl -O https://cdn.bigmodel.cn/install/claude_code_zai_env.sh && bash ./claude_code_zai_env.sh"
echo ""
echo "3. Open Claude Code in this project directory:"
echo "   cd $PROJECT_DIR"
echo "   claude"
echo ""
echo "4. Test: 'List all available MCP tools'"
echo ""
echo "Project-level configuration complete! 🎉"
