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

# Load .env file if it exists
if [ -f "$SCRIPT_DIR/../.env" ]; then
  # Load and expand variables from .env
  set -a
  source "$SCRIPT_DIR/../.env"
  set +a
fi

# Check and set default environment variables
if [ -z "$DATADOG_API_KEY" ]; then
  echo "⚠️  Warning: DATADOG_API_KEY is not set" >&2
fi

if [ -z "$DATADOG_APP_KEY" ]; then
  echo "⚠️  Warning: DATADOG_APP_KEY is not set" >&2
fi

# Set DATADOG_SITE with default
if [ -z "$DATADOG_SITE" ]; then
  export DATADOG_SITE="datadoghq.com"
  echo "ℹ️  Using default DATADOG_SITE: datadoghq.com" >&2
fi

# Set DATADOG_MAX_RETRIES with default
if [ -z "$DATADOG_MAX_RETRIES" ]; then
  export DATADOG_MAX_RETRIES=2
  echo "ℹ️  Using default DATADOG_MAX_RETRIES: 2" >&2
fi

# Set DATADOG_RETRY_DELAY_MS with default
if [ -z "$DATADOG_RETRY_DELAY_MS" ]; then
  export DATADOG_RETRY_DELAY_MS=2000
  echo "ℹ️  Using default DATADOG_RETRY_DELAY_MS: 2000" >&2
fi

# Display loaded configuration
echo "🔧 Datadog MCP Server Configuration:" >&2
echo "   API Key: ${DATADOG_API_KEY:0:10}***" >&2
echo "   App Key: ${DATADOG_APP_KEY:0:10}***" >&2
echo "   Site: $DATADOG_SITE" >&2
echo "   Max Retries: $DATADOG_MAX_RETRIES" >&2
echo "   Retry Delay: ${DATADOG_RETRY_DELAY_MS}ms" >&2
echo "" >&2

# Run the MCP server with Node 20
exec "$NODE_20" "$SCRIPT_DIR/../build/index.js" "$@"
