#!/bin/bash
# Test Datadog API authentication

source .env

echo "Testing Datadog API authentication..."
echo "API Key (first 10 chars): ${DD_API_KEY:0:10}..."
echo "APP Key (first 10 chars): ${DD_APP_KEY:0:10}..."
echo "Site: ${DD_SITE:-datadoghq.com}"
echo ""

# Test API with curl
echo "Testing API endpoint..."
curl -s -X GET \
  "https://api.${DD_SITE:-datadoghq.com}/api/v1/validate" \
  -H "DD-API-KEY: ${DD_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DD_APP_KEY}" | jq . || echo "Failed to validate"

