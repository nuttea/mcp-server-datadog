#!/bin/bash
source .env

NOW=$(date +%s)
SEVEN_DAYS_AGO=$((NOW - 604800))
FROM=$(date -u -r $SEVEN_DAYS_AGO '+%Y-%m-%dT%H:%M:%SZ')
TO=$(date -u -r $NOW '+%Y-%m-%dT%H:%M:%SZ')

echo "Checking if smartids_cpf_uat has APM data..."
curl -s -X POST "https://api.${DATADOG_SITE}/api/v2/spans/events/search" \
  -H "DD-API-KEY: ${DATADOG_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DATADOG_APP_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
  "data": {
    "attributes": {
      "filter": {
        "from": "'"$FROM"'",
        "to": "'"$TO"'",
        "query": "service:smartids_cpf_uat"
      },
      "page": {"limit": 1},
      "sort": "timestamp"
    },
    "type": "search_request"
  }
}' | jq '{found: (.data | length), service: .data[0]?.attributes.service}'

echo ""
echo "Checking if mysmartsales_cpf_uat has APM data..."
curl -s -X POST "https://api.${DATADOG_SITE}/api/v2/spans/events/search" \
  -H "DD-API-KEY: ${DATADOG_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DATADOG_APP_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
  "data": {
    "attributes": {
      "filter": {
        "from": "'"$FROM"'",
        "to": "'"$TO"'",
        "query": "service:mysmartsales_cpf_uat"
      },
      "page": {"limit": 1},
      "sort": "timestamp"
    },
    "type": "search_request"
  }
}' | jq '{found: (.data | length), service: .data[0]?.attributes.service}'
