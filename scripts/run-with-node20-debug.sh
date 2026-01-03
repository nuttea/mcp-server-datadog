#!/bin/bash

# Debug wrapper to see what environment variables are passed by kiro

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_20="${HOME}/.nvm/versions/node/v20.19.6/bin/node"

# Log environment variables to a debug file
echo "=== MCP Server Started at $(date) ===" >> /tmp/datadog-mcp-debug.log
echo "DATADOG_API_KEY=${DATADOG_API_KEY:0:10}..." >> /tmp/datadog-mcp-debug.log
echo "DATADOG_APP_KEY=${DATADOG_APP_KEY:0:10}..." >> /tmp/datadog-mcp-debug.log
echo "DATADOG_SITE=$DATADOG_SITE" >> /tmp/datadog-mcp-debug.log
echo "DD_API_KEY=${DD_API_KEY:0:10}..." >> /tmp/datadog-mcp-debug.log
echo "DD_APP_KEY=${DD_APP_KEY:0:10}..." >> /tmp/datadog-mcp-debug.log
echo "DD_SITE=$DD_SITE" >> /tmp/datadog-mcp-debug.log
echo "" >> /tmp/datadog-mcp-debug.log

# If credentials not set, load from .env
if [ -z "$DATADOG_API_KEY" ] && [ -f "$SCRIPT_DIR/.env" ]; then
  echo "Loading from .env..." >> /tmp/datadog-mcp-debug.log
  set -a
  source "$SCRIPT_DIR/.env"
  set +a

  if [ -z "$DATADOG_API_KEY" ] && [ -n "$DD_API_KEY" ]; then
    export DATADOG_API_KEY="$DD_API_KEY"
  fi
  if [ -z "$DATADOG_APP_KEY" ] && [ -n "$DD_APP_KEY" ]; then
    export DATADOG_APP_KEY="$DD_APP_KEY"
  fi

  echo "After loading - DATADOG_API_KEY=${DATADOG_API_KEY:0:10}..." >> /tmp/datadog-mcp-debug.log
fi

# Run the MCP server
exec "$NODE_20" "$SCRIPT_DIR/build/index.js" "$@"
