#!/bin/bash

# Script to add Datadog remote MCP server to various MCP client settings
# Supports: Gemini, Kiro, Claude Desktop, and custom paths

set -e

# Configuration
MCP_NAME="datadog-mcp"
MCP_URL="https://mcp.datadoghq.com/api/unstable/mcp-server/mcp"
TRUST=true

# Detect MCP client and set settings path
detect_client() {
  case "${1:-auto}" in
    gemini)
      echo "$HOME/.gemini/settings.json"
      ;;
    kiro)
      echo "$HOME/.kiro/settings/mcp.json"
      ;;
    claude)
      if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
      else
        echo "$HOME/.config/Claude/claude_desktop_config.json"
      fi
      ;;
    auto)
      # Auto-detect based on what exists
      if [ -d "$HOME/.gemini" ]; then
        echo "$HOME/.gemini/settings.json"
      elif [ -d "$HOME/.kiro/settings" ]; then
        echo "$HOME/.kiro/settings/mcp.json"
      elif [ -d "$HOME/Library/Application Support/Claude" ]; then
        echo "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
      else
        echo "$HOME/.gemini/settings.json"  # Default to Gemini
      fi
      ;;
    *)
      echo "$1"  # Custom path
      ;;
  esac
}

# Get settings path
CLIENT="${1:-auto}"
SETTINGS_FILE=$(detect_client "$CLIENT")
SETTINGS_DIR=$(dirname "$SETTINGS_FILE")

echo "Adding Datadog remote MCP to: $SETTINGS_FILE"

# Create directory if it doesn't exist
mkdir -p "$SETTINGS_DIR"

# Create settings file if it doesn't exist
if [ ! -f "$SETTINGS_FILE" ]; then
  echo "Creating new settings file..."
  echo '{"mcpServers":{}}' > "$SETTINGS_FILE"
fi

# Backup original file
cp "$SETTINGS_FILE" "${SETTINGS_FILE}.backup"
echo "Backup created: ${SETTINGS_FILE}.backup"

# Add or update the datadog-mcp entry using jq
jq --arg name "$MCP_NAME" \
   --arg url "$MCP_URL" \
   --argjson trust "$TRUST" \
   '
   # Ensure mcpServers exists
   if .mcpServers == null then .mcpServers = {} else . end |
   # Add or update the datadog-mcp entry
   .mcpServers[$name] = {
     "url": $url,
     "trust": $trust
   }
   ' "$SETTINGS_FILE" > "${SETTINGS_FILE}.tmp"

# Replace original with updated file
mv "${SETTINGS_FILE}.tmp" "$SETTINGS_FILE"

echo "✅ Datadog remote MCP added successfully!"
echo ""
echo "Configuration:"
jq ".mcpServers[\"$MCP_NAME\"]" "$SETTINGS_FILE"
echo ""
echo "To test:"
echo "  gemini mcp list"
echo "  # or restart your MCP client"
