#!/bin/bash

echo "==================================="
echo "Datadog Credentials Setup"
echo "==================================="
echo ""

# Check if credentials already exist in environment
if [ -n "$DATADOG_API_KEY" ] && [ -n "$DATADOG_APP_KEY" ]; then
  echo "✅ Found existing credentials in environment:"
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

    # Skip to shell config detection
    if [ -f "$HOME/.zshrc" ]; then
      SHELL_CONFIG="$HOME/.zshrc"
    elif [ -f "$HOME/.bashrc" ]; then
      SHELL_CONFIG="$HOME/.bashrc"
    else
      SHELL_CONFIG="$HOME/.bashrc"
      touch "$SHELL_CONFIG"
    fi

    # Check if already in shell config
    if grep -q "export DATADOG_API_KEY=" "$SHELL_CONFIG"; then
      echo "✅ Credentials already configured in $SHELL_CONFIG"
      echo ""
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
      exit 0
    fi

    # Continue to save to shell config
    echo "Saving credentials to $SHELL_CONFIG..."
  else
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

# Detect shell config file
if [ -f "$HOME/.zshrc" ]; then
  SHELL_CONFIG="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
  SHELL_CONFIG="$HOME/.bashrc"
else
  SHELL_CONFIG="$HOME/.bashrc"
  touch "$SHELL_CONFIG"
fi

# Check if credentials already exist in config
if grep -q "export DATADOG_API_KEY=" "$SHELL_CONFIG"; then
  echo ""
  echo "⚠️  Datadog credentials already exist in $SHELL_CONFIG"
  read -p "Overwrite existing credentials? (y/N): " OVERWRITE
  if [[ ! "$OVERWRITE" =~ ^[Yy]$ ]]; then
    echo "Aborted. No changes made."
    exit 0
  fi
  # Remove old credentials
  sed -i.bak '/# Datadog MCP Server Credentials/d' "$SHELL_CONFIG"
  sed -i.bak '/export DATADOG_API_KEY=/d' "$SHELL_CONFIG"
  sed -i.bak '/export DATADOG_APP_KEY=/d' "$SHELL_CONFIG"
  sed -i.bak '/export DATADOG_SITE=/d' "$SHELL_CONFIG"
fi

# Add credentials to shell config
echo "" >> "$SHELL_CONFIG"
echo "# Datadog MCP Server Credentials (added $(date))" >> "$SHELL_CONFIG"
echo "export DATADOG_API_KEY=\"$DD_API_KEY\"" >> "$SHELL_CONFIG"
echo "export DATADOG_APP_KEY=\"$DD_APP_KEY\"" >> "$SHELL_CONFIG"
echo "export DATADOG_SITE=\"$DD_SITE\"" >> "$SHELL_CONFIG"

echo ""
echo "✅ Credentials saved to $SHELL_CONFIG"
echo ""
echo "To activate in current session, run:"
echo "  source $SHELL_CONFIG"
echo ""
echo "Or start a new terminal session."
echo ""

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
