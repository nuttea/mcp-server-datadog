#!/bin/bash

# Test MCP tools through the local server
# This script sends JSON-RPC requests to the MCP server

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing Datadog MCP Server Tools"
echo "===================================="
echo ""

# Calculate timestamps
NOW=$(date +%s)
ONE_HOUR_AGO=$((NOW - 3600))

echo "📊 Test 1: get_service_stats_realtime (with relative time)"
echo "Service: agent-api, Time: now-1h to now"
echo ""

# Create JSON-RPC request for get_service_stats_realtime
cat <<EOF | "$SCRIPT_DIR/build/index.js" 2>&1 | grep -v "DEBUG" | tail -20
{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0.0"}}}
{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "get_service_stats_realtime", "arguments": {"service": "agent-api", "from": "now-1h", "to": "now"}}}
EOF

echo ""
echo "---"
echo ""

echo "📊 Test 2: get_service_stats_realtime (with Unix timestamps)"
echo "Service: agent-api"
echo ""

cat <<EOF | "$SCRIPT_DIR/build/index.js" 2>&1 | grep -v "DEBUG" | tail -20
{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0.0"}}}
{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "get_service_stats_realtime", "arguments": {"service": "agent-api", "from": $ONE_HOUR_AGO, "to": $NOW}}}
EOF

echo ""
echo "---"
echo ""

echo "📍 Test 3: get_service_endpoints"
echo "Service: agent-api, Limit: 5"
echo ""

cat <<EOF | "$SCRIPT_DIR/build/index.js" 2>&1 | grep -v "DEBUG" | tail -20
{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0.0"}}}
{"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "get_service_endpoints", "arguments": {"service": "agent-api", "from": $ONE_HOUR_AGO, "to": $NOW, "limit": 5}}}
EOF

echo ""
echo "---"
echo ""

echo "📋 Test 4: list_service_definitions"
echo ""

cat <<EOF | "$SCRIPT_DIR/build/index.js" 2>&1 | grep -v "DEBUG" | tail -20
{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0.0"}}}
{"jsonrpc": "2.0", "id": 5, "method": "tools/call", "params": {"name": "list_service_definitions", "arguments": {"page_size": 5}}}
EOF

echo ""
echo "✨ Testing complete!"
