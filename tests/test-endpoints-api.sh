#!/bin/bash

# Test endpoints API with groupBy
source .env

NOW=$(date +%s)
ONE_HOUR_AGO=$((NOW - 3600))
FROM=$(date -u -r $ONE_HOUR_AGO '+%Y-%m-%dT%H:%M:%SZ')
TO=$(date -u -r $NOW '+%Y-%m-%dT%H:%M:%SZ')

echo "Testing Datadog Spans API - aggregateSpans with groupBy resource_name"
echo "Service: agent-api"
echo "From: $FROM"
echo "To: $TO"
echo ""

curl -X POST "https://api.${DATADOG_SITE}/api/v2/spans/analytics/aggregate" \
  -H "Content-Type: application/json" \
  -H "DD-API-KEY: ${DATADOG_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DATADOG_APP_KEY}" \
  -d '{
  "data": {
    "attributes": {
      "compute": [
        {"aggregation": "count", "metric": "@duration"},
        {"aggregation": "avg", "metric": "@duration"},
        {"aggregation": "pc95", "metric": "@duration"}
      ],
      "filter": {
        "from": "'"$FROM"'",
        "to": "'"$TO"'",
        "query": "service:agent-api"
      },
      "groupBy": [
        {"facet": "resource_name", "limit": 5},
        {"facet": "error", "limit": 2}
      ]
    },
    "type": "aggregate_request"
  }
}' | jq '.'
