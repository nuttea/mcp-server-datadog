#!/bin/bash
source .env

echo "Checking Service Catalog pagination..."
curl -s -X GET "https://api.${DATADOG_SITE}/api/v2/services/definitions?page[size]=100" \
  -H "DD-API-KEY: ${DATADOG_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DATADOG_APP_KEY}" | jq '{total: (.data | length), services: [.data[].attributes.schema."dd-service" // .data[].attributes.schema.ddService]}'
