#!/bin/bash

# Universal script to add any MCP server (local or remote) to settings.json
# Usage: ./add-mcp-server.sh [client] [name] [url|command] [env_vars_json]

set -e

# Help message
show_help() {
  cat << EOF
Usage: $0 [CLIENT] [OPTIONS]

Add MCP server to client settings using jq

CLIENTS:
  gemini    - Gemini AI (~/.gemini/settings.json)
  kiro      - Kiro CLI (~/.kiro/settings/mcp.json)
  claude    - Claude Desktop
  auto      - Auto-detect (default)
  <path>    - Custom settings.json path

EXAMPLES:
  # Add remote Datadog MCP to Gemini
  $0 gemini datadog-mcp-remote https://mcp.datadoghq.com/api/unstable/mcp-server/mcp

  # Add local Datadog MCP to Kiro
  $0 kiro datadog-mcp-local /path/to/build/index.js '{"DATADOG_API_KEY":"key"}'

  # Auto-detect client
  $0 auto my-mcp https://example.com/mcp

EOF
  exit 0
}

# Parse arguments
[ "$1" = "-h" ] || [ "$1" = "--help" ] && show_help

CLIENT="${1:-auto}"
MCP_NAME="${2:-datadog-mcp}"
MCP_SOURCE="${3}"  # URL for remote, command path for local
ENV_JSON="${4:-{}}"

if [ -z "$MCP_SOURCE" ]; then
  echo "❌ Error: MCP source (URL or command path) required"
  echo "Run: $0 --help"
  exit 1
fi

# Detect client settings path
detect_settings_path() {
  case "$1" in
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
      if [ -d "$HOME/.gemini" ]; then
        echo "$HOME/.gemini/settings.json"
      elif [ -d "$HOME/.kiro/settings" ]; then
        echo "$HOME/.kiro/settings/mcp.json"
      elif [ -d "$HOME/Library/Application Support/Claude" ]; then
        echo "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
      else
        echo "$HOME/.gemini/settings.json"
      fi
      ;;
    *)
      echo "$1"
      ;;
  esac
}

SETTINGS_FILE=$(detect_settings_path "$CLIENT")
SETTINGS_DIR=$(dirname "$SETTINGS_FILE")

echo "Target: $SETTINGS_FILE"

# Create directory
mkdir -p "$SETTINGS_DIR"

# Create file if doesn't exist
if [ ! -f "$SETTINGS_FILE" ]; then
  echo "Creating new settings file..."
  echo '{"mcpServers":{}}' > "$SETTINGS_FILE"
fi

# Backup
cp "$SETTINGS_FILE" "${SETTINGS_FILE}.backup.$(date +%s)"
echo "Backup created"

# Determine if remote (URL) or local (file path)
if [[ "$MCP_SOURCE" =~ ^https?:// ]]; then
  # Remote MCP server
  echo "Adding remote MCP server..."
  jq --arg name "$MCP_NAME" \
     --arg url "$MCP_SOURCE" \
     '
     if .mcpServers == null then .mcpServers = {} else . end |
     .mcpServers[$name] = {
       "url": $url,
       "trust": true
     }
     ' "$SETTINGS_FILE" > "${SETTINGS_FILE}.tmp"
else
  # Local MCP server
  echo "Adding local MCP server..."
  jq --arg name "$MCP_NAME" \
     --arg command "$MCP_SOURCE" \
     --argjson env "$ENV_JSON" \
     '
     if .mcpServers == null then .mcpServers = {} else . end |
     .mcpServers[$name] = {
       "command": $command,
       "env": $env
     }
     ' "$SETTINGS_FILE" > "${SETTINGS_FILE}.tmp"
fi

# Replace original
mv "${SETTINGS_FILE}.tmp" "$SETTINGS_FILE"

echo "✅ MCP server '$MCP_NAME' added successfully!"
echo ""
echo "Configuration:"
jq ".mcpServers[\"$MCP_NAME\"]" "$SETTINGS_FILE"
echo ""
echo "All MCP servers:"
jq '.mcpServers | keys' "$SETTINGS_FILE"
