#!/bin/bash

# Test endpoints API with only resource_name groupBy
source .env

NOW=$(date +%s)
ONE_HOUR_AGO=$((NOW - 3600))
FROM=$(date -u -r $ONE_HOUR_AGO '+%Y-%m-%dT%H:%M:%SZ')
TO=$(date -u -r $NOW '+%Y-%m-%dT%H:%M:%SZ')

echo "Testing with resource_name groupBy only (no error facet)"
echo ""

curl -X POST "https://api.${DATADOG_SITE}/api/v2/spans/analytics/aggregate" \
  -H "Content-Type: application/json" \
  -H "DD-API-KEY: ${DATADOG_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DATADOG_APP_KEY}" \
  -d '{
  "data": {
    "attributes": {
      "compute": [
        {"aggregation": "count", "metric": "@duration"}
      ],
      "filter": {
        "from": "'"$FROM"'",
        "to": "'"$TO"'",
        "query": "service:agent-api"
      },
      "groupBy": [
        {"facet": "resource_name", "limit": 5}
      ]
    },
    "type": "aggregate_request"
  }
}' | jq '.'
