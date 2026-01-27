#!/bin/bash
source .env

NOW=$(date +%s)
SEVEN_DAYS_AGO=$((NOW - 604800))

echo "=== Test 1: Check if pre-aggregated metrics exist ==="
echo "Query: trace.mysmartsales_cpf_uat.request.hits"
curl -s "https://api.${DATADOG_SITE}/api/v1/query?from=${SEVEN_DAYS_AGO}&to=${NOW}&query=sum:trace.mysmartsales_cpf_uat.request.hits{env:uat}.as_rate()" \
  -H "DD-API-KEY: ${DATADOG_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DATADOG_APP_KEY}" | jq '{status: .status, error: .error, series_count: (.series | length)}'

echo ""
echo "=== Test 2: Check available trace metrics for service ==="
curl -s "https://api.${DATADOG_SITE}/api/v1/metrics?filter=trace.mysmartsales" \
  -H "DD-API-KEY: ${DATADOG_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DATADOG_APP_KEY}" | jq '.metrics[0:10]'

echo ""
echo "=== Test 3: Check span resource_names ==="
FROM=$(date -u -r $SEVEN_DAYS_AGO '+%Y-%m-%dT%H:%M:%SZ')
TO=$(date -u -r $NOW '+%Y-%m-%dT%H:%M:%SZ')
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
      "page": {"limit": 10},
      "sort": "timestamp"
    },
    "type": "search_request"
  }
}' | jq -r '.data[].attributes.resource_name' | sort | uniq -c | sort -rn
