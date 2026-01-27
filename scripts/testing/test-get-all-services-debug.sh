#!/bin/bash

echo "Testing get_all_services with debug output..."
echo ""

# Run MCP server and call get_all_services
cat <<EOF | ./build/index.js 2>&1 | grep -E "(INFO|get_all_services|Services:|ERROR)"
{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0.0"}}}
{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "get_all_services", "arguments": {}}}
EOF
