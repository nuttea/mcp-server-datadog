#!/bin/bash
source .env

NOW=$(date +%s)
SEVEN_DAYS_AGO=$((NOW - 604800))

echo "Testing APM Services List API..."
echo "Endpoint: /api/v2/apm/services"
echo "Timeframe: Last 7 days"
echo ""

curl -s "https://app.${DATADOG_SITE}/api/v2/apm/services?filter%5Benv%5D=%2A&filter%5Bfrom%5D=${SEVEN_DAYS_AGO}&filter%5Bto%5D=${NOW}&source=web-ui&datastore=metrics" \
  -H "DD-API-KEY: ${DATADOG_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DATADOG_APP_KEY}" | jq '{total: (.data.attributes.services | length), services: .data.attributes.services}'
