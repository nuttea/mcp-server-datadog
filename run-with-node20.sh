#!/bin/bash

# Wrapper script to run Datadog MCP Server with Node 20
# This ensures compatibility with @modelcontextprotocol/sdk

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Use Node 20 from nvm
NODE_20="${HOME}/.nvm/versions/node/v20.19.6/bin/node"

# Fallback to system node if Node 20 not found
if [ ! -f "$NODE_20" ]; then
  NODE_20="node"
fi

# Only load .env if credentials aren't already set (e.g., when called directly, not via kiro)
if [ -z "$DATADOG_API_KEY" ] && [ -f "$SCRIPT_DIR/.env" ]; then
  # Load and expand variables from .env
  set -a
  source "$SCRIPT_DIR/.env"
  set +a

  # If DATADOG_API_KEY is still not set, try using DD_API_KEY
  if [ -z "$DATADOG_API_KEY" ] && [ -n "$DD_API_KEY" ]; then
    export DATADOG_API_KEY="$DD_API_KEY"
  fi
  if [ -z "$DATADOG_APP_KEY" ] && [ -n "$DD_APP_KEY" ]; then
    export DATADOG_APP_KEY="$DD_APP_KEY"
  fi
fi

# Run the MCP server with Node 20
exec "$NODE_20" "$SCRIPT_DIR/build/index.js" "$@"
