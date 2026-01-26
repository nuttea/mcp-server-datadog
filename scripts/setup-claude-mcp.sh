#!/bin/bash

echo "==================================="
echo "Claude Code MCP Server Setup"
echo "==================================="
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo "❌ jq is not installed. Installing jq..."
  if command -v apt-get &> /dev/null; then
    sudo apt-get update && sudo apt-get install -y jq
  elif command -v yum &> /dev/null; then
    sudo yum install -y jq
  elif command -v brew &> /dev/null; then
    brew install jq
  else
    echo "Please install jq manually: https://stedolan.github.io/jq/download/"
    exit 1
  fi
fi

# Get the MCP server path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_SERVER_PATH="$(cd "$SCRIPT_DIR/.." && pwd)/build/index.js"

# Verify the MCP server exists
if [ ! -f "$MCP_SERVER_PATH" ]; then
  echo "❌ MCP server not found at: $MCP_SERVER_PATH"
  echo ""
  echo "Please build the server first:"
  echo "  cd ~/mcp-server-datadog"
  echo "  pnpm install && pnpm build"
  exit 1
fi

echo "✓ Found MCP server at: $MCP_SERVER_PATH"
echo ""

# Verify Datadog credentials
if [ -z "$DATADOG_API_KEY" ] || [ -z "$DATADOG_APP_KEY" ]; then
  echo "⚠️  Warning: Datadog credentials not found in environment"
  echo ""
  echo "Please set up Datadog credentials first:"
  echo "  cd ~/mcp-server-datadog"
  echo "  bash scripts/setup-datadog-env.sh"
  echo ""
  read -p "Continue anyway? (y/N): " CONTINUE
  if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

# Create Claude config directory
CLAUDE_CONFIG_DIR="$HOME/.claude"
CLAUDE_SETTINGS="$CLAUDE_CONFIG_DIR/settings.json"

mkdir -p "$CLAUDE_CONFIG_DIR"

# Create MCP server configuration
MCP_CONFIG=$(cat <<EOF
{
  "mcpServers": {
    "datadog": {
      "command": "node",
      "args": ["$MCP_SERVER_PATH"],
      "env": {
        "DATADOG_API_KEY": "\${DATADOG_API_KEY}",
        "DATADOG_APP_KEY": "\${DATADOG_APP_KEY}",
        "DATADOG_SITE": "\${DATADOG_SITE}"
      }
    }
  }
}
EOF
)

# Model environment variables for Z.AI GLM 4.7 Flash
MODEL_ENV=$(cat <<EOF
{
  "env": {
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.7-flash",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7-flash",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.7-flash"
  }
}
EOF
)

# Check if settings.json exists
if [ -f "$CLAUDE_SETTINGS" ]; then
  echo "Found existing settings.json"

  # Check if datadog MCP server already exists
  if jq -e '.mcpServers.datadog' "$CLAUDE_SETTINGS" > /dev/null 2>&1; then
    echo ""
    echo "⚠️  Datadog MCP server already configured"
    read -p "Overwrite existing configuration? (y/N): " OVERWRITE
    if [[ ! "$OVERWRITE" =~ ^[Yy]$ ]]; then
      echo "Aborted. No changes made."
      exit 0
    fi
  fi

  # Backup existing settings
  cp "$CLAUDE_SETTINGS" "$CLAUDE_SETTINGS.backup.$(date +%Y%m%d_%H%M%S)"
  echo "✓ Backed up existing settings"

  # Merge configurations
  TMP_FILE=$(mktemp)
  jq --argjson mcp "$MCP_CONFIG" \
     --argjson models "$MODEL_ENV" \
     '.mcpServers.datadog = $mcp.mcpServers.datadog |
      .env.ANTHROPIC_DEFAULT_HAIKU_MODEL = $models.env.ANTHROPIC_DEFAULT_HAIKU_MODEL |
      .env.ANTHROPIC_DEFAULT_SONNET_MODEL = $models.env.ANTHROPIC_DEFAULT_SONNET_MODEL |
      .env.ANTHROPIC_DEFAULT_OPUS_MODEL = $models.env.ANTHROPIC_DEFAULT_OPUS_MODEL' \
     "$CLAUDE_SETTINGS" > "$TMP_FILE"

  if [ $? -eq 0 ]; then
    mv "$TMP_FILE" "$CLAUDE_SETTINGS"
    echo "✓ Updated settings.json with Datadog MCP server"
    echo "✓ Updated model mappings for GLM 4.7 Flash"
  else
    echo "❌ Failed to merge configuration"
    rm -f "$TMP_FILE"
    exit 1
  fi
else
  echo "Creating new settings.json"

  # Create minimal settings with MCP server and model mappings
  cat > "$CLAUDE_SETTINGS" <<EOF
{
  "env": {
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.7-flash",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7-flash",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.7-flash"
  },
  "mcpServers": {
    "datadog": {
      "command": "node",
      "args": ["$MCP_SERVER_PATH"],
      "env": {
        "DATADOG_API_KEY": "\${DATADOG_API_KEY}",
        "DATADOG_APP_KEY": "\${DATADOG_APP_KEY}",
        "DATADOG_SITE": "\${DATADOG_SITE}"
      }
    }
  }
}
EOF
  echo "✓ Created settings.json with Datadog MCP server"
  echo "✓ Added model mappings for GLM 4.7 Flash"
fi

echo ""
echo "==================================="
echo "Configuration Summary"
echo "==================================="
echo "Settings file: $CLAUDE_SETTINGS"
echo "MCP server path: $MCP_SERVER_PATH"
echo "Model mappings: glm-4.7-flash (haiku, sonnet, opus)"
echo "Datadog API Key: ${DATADOG_API_KEY:0:10}***"
echo "Datadog App Key: ${DATADOG_APP_KEY:0:10}***"
echo "Datadog Site: ${DATADOG_SITE:-not set}"
echo ""

# Validate JSON
if jq empty "$CLAUDE_SETTINGS" 2>/dev/null; then
  echo "✅ Configuration file is valid JSON"
else
  echo "❌ Configuration file has JSON syntax errors!"
  exit 1
fi

echo ""
echo "==================================="
echo "Next Steps"
echo "==================================="
echo "1. If you haven't set up Z.AI, run:"
echo "   curl -O https://cdn.bigmodel.cn/install/claude_code_zai_env.sh && bash ./claude_code_zai_env.sh"
echo ""
echo "2. Start Claude Code:"
echo "   claude"
echo ""
echo "3. Test the MCP server:"
echo "   Type: List all available MCP tools"
echo ""
echo "You should see 32 Datadog tools available!"
echo ""
echo "Setup complete! 🚀"
