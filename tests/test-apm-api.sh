#!/bin/bash

# Load environment variables
source .env

# Calculate timestamps
NOW=$(date +%s)
ONE_HOUR_AGO=$((NOW - 3600))

# Convert to ISO format for API
FROM=$(date -u -r $ONE_HOUR_AGO '+%Y-%m-%dT%H:%M:%SZ')
TO=$(date -u -r $NOW '+%Y-%m-%dT%H:%M:%SZ')

echo "Testing Datadog Spans API - aggregateSpans"
echo "Service: agent-api"
echo "From: $FROM"
echo "To: $TO"
echo ""

# Test aggregateSpans API
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
        {"aggregation": "pc75", "metric": "@duration"},
        {"aggregation": "pc95", "metric": "@duration"},
        {"aggregation": "pc99", "metric": "@duration"},
        {"aggregation": "max", "metric": "@duration"}
      ],
      "filter": {
        "from": "'"$FROM"'",
        "to": "'"$TO"'",
        "query": "service:agent-api"
      }
    },
    "type": "aggregate_request"
  }
}' | jq '.'
