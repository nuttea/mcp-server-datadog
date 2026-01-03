#!/bin/bash
set -e

echo "Setting up Datadog MCP Server for Kiro CLI..."

# Check Node 20 is available
if [ ! -f "$HOME/.nvm/versions/node/v20.19.6/bin/node" ]; then
  echo "❌ Node 20.19.6 not found. Install with: nvm install 20.19.6"
  exit 1
fi

# Load all environment variables from .env file
if [ -f .env ]; then
  echo "Loading environment variables from .env..."
  set -a  # Auto-export all variables
  source .env
  set +a
else
  echo "❌ Error: .env file not found"
  exit 1
fi

# Check credentials (use DD_API_KEY and DD_APP_KEY)
if [ -z "$DD_API_KEY" ] || [ -z "$DD_APP_KEY" ]; then
  echo "❌ Error: DD_API_KEY and DD_APP_KEY must be set in .env"
  exit 1
fi

# Remove old server if it exists
kiro-cli mcp remove datadog-mcp-local 2>/dev/null || true

# Add new server using DD_* credentials
kiro-cli mcp add \
  --name "datadog-mcp-local" \
  --scope global \
  --command "$(pwd)/run-with-node20.sh" \
  --env "DATADOG_API_KEY=${DD_API_KEY}" \
  --env "DATADOG_APP_KEY=${DD_APP_KEY}" \
  --env "DATADOG_SITE=${DD_SITE:-datadoghq.com}" \
  --env "DATADOG_MAX_RETRIES=${DATADOG_MAX_RETRIES:-2}" \
  --env "DATADOG_RETRY_DELAY_MS=${DATADOG_RETRY_DELAY_MS:-2000}" \
  --force

echo "✅ Datadog MCP Server configured for Kiro CLI!"
echo ""
echo "Credentials loaded:"
echo "  DD_API_KEY: ${DD_API_KEY:0:10}..."
echo "  DD_APP_KEY: ${DD_APP_KEY:0:10}..."
echo "  DATADOG_SITE: ${DD_SITE:-datadoghq.com}"
echo ""
echo "Test it:"
echo "  kiro-cli"
echo '  > "List available Datadog tools"'
