#!/bin/bash
source .env

NOW=$(date +%s)
SEVEN_DAYS_AGO=$((NOW - 604800))

echo "Testing with api.datadoghq.com..."
curl -v "https://api.${DATADOG_SITE}/api/v2/apm/services?filter%5Benv%5D=%2A&filter%5Bfrom%5D=${SEVEN_DAYS_AGO}&filter%5Bto%5D=${NOW}" \
  -H "DD-API-KEY: ${DATADOG_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DATADOG_APP_KEY}" 2>&1 | head -40

echo ""
echo "---"
echo "Testing with app.datadoghq.com..."
curl -v "https://app.${DATADOG_SITE}/api/v2/apm/services?filter%5Benv%5D=%2A&filter%5Bfrom%5D=${SEVEN_DAYS_AGO}&filter%5Bto%5D=${NOW}" \
  -H "DD-API-KEY: ${DATADOG_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DATADOG_APP_KEY}" 2>&1 | head -40
