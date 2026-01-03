#!/bin/bash
set -e

echo "Setting up Datadog MCP Server for Cursor IDE..."

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

# Get absolute path to project
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Cursor uses .cursor/mcp.json
CONFIG_DIR="$HOME/.cursor"
CONFIG_FILE="$CONFIG_DIR/mcp.json"

# Create config directory
mkdir -p "$CONFIG_DIR"

# Check if config exists
if [ ! -f "$CONFIG_FILE" ]; then
  echo "Creating new Cursor MCP config..."
  cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {}
}
EOF
fi

# Add Datadog MCP server
echo "Adding Datadog MCP server to Cursor config..."

if command -v jq &> /dev/null; then
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

  echo "✅ Datadog MCP Server configured for Cursor!"
else
  echo "⚠️  jq not found. Manual configuration needed:"
  cat << EOF

Add to $CONFIG_FILE:

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

echo ""
echo "Config file: $CONFIG_FILE"
echo "Server name: datadog-local"
echo ""
echo "Next steps:"
echo "1. Restart Cursor IDE"
echo "2. Open Cursor Settings → MCP Servers"
echo "3. Verify 'datadog-local' is listed"
echo "4. Test: Ask Cursor AI 'List my Datadog monitors'"
echo ""
