#!/bin/bash

echo "==================================="
echo "Datadog Credentials Setup"
echo "==================================="
echo ""

# Determine project directory (parent of scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

# Check if .env file already exists with credentials
if [ -f "$ENV_FILE" ]; then
  if grep -q "^DATADOG_API_KEY=" "$ENV_FILE" && grep -q "^DATADOG_APP_KEY=" "$ENV_FILE"; then
    echo "✅ Found existing credentials in $ENV_FILE"

    # Load and export existing credentials
    source "$ENV_FILE"
    export DATADOG_API_KEY
    export DATADOG_APP_KEY
    export DATADOG_SITE
    echo "   API Key: ${DATADOG_API_KEY:0:10}***"
    echo "   App Key: ${DATADOG_APP_KEY:0:10}***"
    echo "   Site: ${DATADOG_SITE:-datadoghq.com}"
    echo ""
    read -p "Use existing credentials? (Y/n): " USE_EXISTING

    if [[ ! "$USE_EXISTING" =~ ^[Nn]$ ]]; then
      DD_API_KEY="$DATADOG_API_KEY"
      DD_APP_KEY="$DATADOG_APP_KEY"
      DD_SITE="${DATADOG_SITE:-datadoghq.com}"
      echo "✅ Using existing credentials"
      echo ""

      # Offer to test credentials
      read -p "Test Datadog API connection? (y/N): " TEST_API
      if [[ "$TEST_API" =~ ^[Yy]$ ]]; then
        echo ""
        echo "Testing Datadog API connection..."
        RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "https://api.$DD_SITE/api/v1/validate" \
          -H "DD-API-KEY: $DD_API_KEY" \
          -H "DD-APPLICATION-KEY: $DD_APP_KEY")

        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

        if [ "$HTTP_CODE" = "200" ]; then
          echo "✅ Connection successful! Your credentials are valid."
        else
          echo "❌ Connection failed (HTTP $HTTP_CODE)"
          echo "Please verify your credentials and site setting."
        fi
      fi
      echo ""
      echo "Setup complete!"
      echo ""
      echo "💡 Credentials are stored in: $ENV_FILE"
      echo "   (This file is git-ignored for security)"
      echo "✅ Environment variables exported for current session"
      exit 0
    fi

    echo "Entering new credentials..."
    echo ""
  fi
fi

# Prompt for API Key
read -p "Enter your Datadog API Key: " DD_API_KEY
while [ -z "$DD_API_KEY" ]; do
  echo "API Key cannot be empty!"
  read -p "Enter your Datadog API Key: " DD_API_KEY
done

# Prompt for Application Key
read -p "Enter your Datadog Application Key: " DD_APP_KEY
while [ -z "$DD_APP_KEY" ]; do
  echo "Application Key cannot be empty!"
  read -p "Enter your Datadog Application Key: " DD_APP_KEY
done

# Prompt for Site with default
echo ""
echo "Common Datadog Sites:"
echo "  - datadoghq.com (US1, default)"
echo "  - datadoghq.eu (EU)"
echo "  - us3.datadoghq.com (US3)"
echo "  - us5.datadoghq.com (US5)"
echo "  - ap1.datadoghq.com (AP1)"
echo "  - ddog-gov.com (US1-FED)"
echo ""
read -p "Enter your Datadog Site [datadoghq.com]: " DD_SITE
DD_SITE=${DD_SITE:-datadoghq.com}

# Backup existing .env if it exists
if [ -f "$ENV_FILE" ]; then
  cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
  echo "📦 Backed up existing .env file"

  # Remove old Datadog credentials from .env
  sed -i.bak '/^DATADOG_API_KEY=/d' "$ENV_FILE"
  sed -i.bak '/^DATADOG_APP_KEY=/d' "$ENV_FILE"
  sed -i.bak '/^DATADOG_SITE=/d' "$ENV_FILE"
  sed -i.bak '/^# Datadog MCP Server Credentials/d' "$ENV_FILE"
  rm -f "$ENV_FILE.bak"
fi

# Create or update .env file
echo "" >> "$ENV_FILE"
echo "# Datadog MCP Server Credentials (added $(date))" >> "$ENV_FILE"
echo "DATADOG_API_KEY=\"$DD_API_KEY\"" >> "$ENV_FILE"
echo "DATADOG_APP_KEY=\"$DD_APP_KEY\"" >> "$ENV_FILE"
echo "DATADOG_SITE=\"$DD_SITE\"" >> "$ENV_FILE"

# Export environment variables for current session
export DATADOG_API_KEY="$DD_API_KEY"
export DATADOG_APP_KEY="$DD_APP_KEY"
export DATADOG_SITE="$DD_SITE"

echo ""
echo "✅ Credentials saved to $ENV_FILE"
echo "✅ Environment variables exported for current session"
echo ""
echo "💡 The .env file is automatically loaded by:"
echo "   - Node.js scripts (using dotenv)"
echo "   - Claude Code MCP server"
echo "   - Integration tests"
echo ""

# Ensure .env is in .gitignore
GITIGNORE_FILE="$PROJECT_DIR/.gitignore"
if [ -f "$GITIGNORE_FILE" ]; then
  if ! grep -q "^\.env$" "$GITIGNORE_FILE"; then
    echo ".env" >> "$GITIGNORE_FILE"
    echo "✅ Added .env to .gitignore"
  fi
else
  echo ".env" > "$GITIGNORE_FILE"
  echo "✅ Created .gitignore with .env entry"
fi

# Offer to test credentials
read -p "Test Datadog API connection now? (y/N): " TEST_API
if [[ "$TEST_API" =~ ^[Yy]$ ]]; then
  echo ""
  echo "Testing Datadog API connection..."
  RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "https://api.$DD_SITE/api/v1/validate" \
    -H "DD-API-KEY: $DD_API_KEY" \
    -H "DD-APPLICATION-KEY: $DD_APP_KEY")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Connection successful! Your credentials are valid."
  else
    echo "❌ Connection failed (HTTP $HTTP_CODE)"
    echo "Please verify your credentials and site setting."
    echo ""
    echo "Get your keys at:"
    echo "  API Key: https://app.$DD_SITE/organization-settings/api-keys"
    echo "  App Key: https://app.$DD_SITE/organization-settings/application-keys"
  fi
fi

echo ""
echo "Setup complete!"
echo ""
echo "🔒 Security note: Never commit the .env file to git!"
