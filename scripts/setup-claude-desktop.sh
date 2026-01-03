#!/bin/bash
set -e

echo "Setting up Datadog MCP Server for Claude Desktop..."

# Load environment variables
if [ -f .env ]; then
  echo "Loading environment variables from .env..."
  set -a
  source .env
  set +a
else
  echo "❌ Error: .env file not found"
  exit 1
fi

# Check credentials
if [ -z "$DD_API_KEY" ] || [ -z "$DD_APP_KEY" ]; then
  echo "❌ Error: DD_API_KEY and DD_APP_KEY must be set in .env"
  exit 1
fi

# Determine OS
if [[ "$OSTYPE" == "darwin"* ]]; then
  CONFIG_DIR="$HOME/Library/Application Support/Claude"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  CONFIG_DIR="$HOME/.config/Claude"
else
  echo "❌ Unsupported OS: $OSTYPE"
  exit 1
fi

CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"

# Create config directory if it doesn't exist
mkdir -p "$CONFIG_DIR"

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
  echo "Creating new Claude Desktop config..."
  cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {}
}
EOF
fi

# Get absolute path to project
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Add or update Datadog MCP server in config
echo "Adding Datadog MCP server to Claude Desktop config..."

# Use jq to update the config (or create simple version if jq not available)
if command -v jq &> /dev/null; then
  # Use jq for proper JSON handling
  TMP_FILE=$(mktemp)
  jq --arg cmd "$PROJECT_DIR/run-with-node20.sh" \
     --arg api_key "$DD_API_KEY" \
     --arg app_key "$DD_APP_KEY" \
     --arg site "${DD_SITE:-datadoghq.com}" \
     '.mcpServers["datadog-local"] = {
       "command": $cmd,
       "env": {
         "DATADOG_API_KEY": $api_key,
         "DATADOG_APP_KEY": $app_key,
         "DATADOG_SITE": $site
       }
     }' "$CONFIG_FILE" > "$TMP_FILE"
  mv "$TMP_FILE" "$CONFIG_FILE"
else
  echo "⚠️  jq not found. Please manually add to $CONFIG_FILE:"
  cat << EOF

{
  "mcpServers": {
    "datadog-local": {
      "command": "$PROJECT_DIR/run-with-node20.sh",
      "env": {
        "DATADOG_API_KEY": "$DD_API_KEY",
        "DATADOG_APP_KEY": "$DD_APP_KEY",
        "DATADOG_SITE": "${DD_SITE:-datadoghq.com}"
      }
    }
  }
}
EOF
  exit 0
fi

echo "✅ Datadog MCP Server configured for Claude Desktop!"
echo ""
echo "Config file: $CONFIG_FILE"
echo "Server name: datadog-local"
echo ""
echo "Next steps:"
echo "1. Restart Claude Desktop application"
echo "2. Open Claude Desktop and verify MCP server is loaded"
echo "3. Test: Ask Claude 'List my Datadog monitors'"
echo ""
