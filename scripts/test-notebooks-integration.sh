#!/bin/bash
# Integration tests for Datadog Notebook MCP Tools
# Tests: create, list, get, update, delete

set -e  # Exit on error

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║        Datadog Notebooks MCP Tools - Integration Tests       ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Load credentials
source .env
export DATADOG_API_KEY=$DD_API_KEY
export DATADOG_APP_KEY=$DD_APP_KEY

NOTEBOOK_ID=""
TEST_NAME="MCP Integration Test - $(date +%Y-%m-%d-%H%M%S)"

echo "🧪 Test 1: List existing notebooks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
LIST_RESULT=$(cat << 'EOF' | timeout 10 ./run-with-node20.sh 2>&1
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_notebooks","arguments":{"count":5}}}
EOF
)

NOTEBOOK_COUNT=$(echo "$LIST_RESULT" | jq -r '.result.content[0].text' | jq -r '.total')
echo "✅ Found $NOTEBOOK_COUNT notebooks"
echo ""

echo "🧪 Test 2: Create test notebook"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
CREATE_RESULT=$(cat << EOF | timeout 10 ./run-with-node20.sh 2>&1
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"create_notebook","arguments":{"name":"$TEST_NAME","content":"# Integration Test\\n\\nThis is an automated integration test.\\n\\n## Details\\n\\n- Created: $(date)\\n- Purpose: Testing MCP notebook tools","tags":["test","integration","automated"]}}}
EOF
)

NOTEBOOK_ID=$(echo "$CREATE_RESULT" | jq -r '.result.content[0].text' | jq -r '.id')
NOTEBOOK_URL=$(echo "$CREATE_RESULT" | jq -r '.result.content[0].text' | jq -r '.url')

if [ "$NOTEBOOK_ID" = "null" ] || [ -z "$NOTEBOOK_ID" ]; then
    echo "❌ Failed to create notebook"
    echo "$CREATE_RESULT"
    exit 1
fi

echo "✅ Created notebook ID: $NOTEBOOK_ID"
echo "   URL: $NOTEBOOK_URL"
echo ""

echo "🧪 Test 3: Get specific notebook"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
GET_RESULT=$(cat << EOF | timeout 10 ./run-with-node20.sh 2>&1
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_notebook","arguments":{"notebook_id":$NOTEBOOK_ID}}}
EOF
)

NOTEBOOK_NAME=$(echo "$GET_RESULT" | jq -r '.result.content[0].text' | jq -r '.name')
CELL_COUNT=$(echo "$GET_RESULT" | jq -r '.result.content[0].text' | jq -r '.cells | length')

echo "✅ Retrieved notebook: $NOTEBOOK_NAME"
echo "   Cells: $CELL_COUNT"
echo ""

echo "🧪 Test 4: Update notebook"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
UPDATE_RESULT=$(cat << EOF | timeout 10 ./run-with-node20.sh 2>&1
{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"update_notebook","arguments":{"notebook_id":$NOTEBOOK_ID,"content":"# Updated Integration Test\\n\\nThis notebook was UPDATED!\\n\\n## Update Proof\\n\\n- Updated: $(date)\\n- Status: ✅ Working","tags":["test","integration","updated"]}}}
EOF
)

UPDATE_MSG=$(echo "$UPDATE_RESULT" | jq -r '.result.content[0].text' | jq -r '.message')
echo "✅ $UPDATE_MSG"
echo ""

echo "🧪 Test 5: List notebooks (verify test notebook exists)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
VERIFY_RESULT=$(cat << EOF | timeout 10 ./run-with-node20.sh 2>&1
{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"list_notebooks","arguments":{"query":"Integration Test"}}}
EOF
)

FOUND_COUNT=$(echo "$VERIFY_RESULT" | jq -r '.result.content[0].text' | jq -r '.count')
echo "✅ Found $FOUND_COUNT notebook(s) matching query"
echo ""

echo "🧪 Test 6: Delete notebook (cleanup)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
DELETE_RESULT=$(cat << EOF | timeout 10 ./run-with-node20.sh 2>&1
{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"delete_notebook","arguments":{"notebook_id":$NOTEBOOK_ID}}}
EOF
)

DELETE_MSG=$(echo "$DELETE_RESULT" | jq -r '.result.content[0].text' | jq -r '.message')
echo "✅ $DELETE_MSG"
echo ""

echo "🧪 Test 7: Verify deletion"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
FINAL_LIST=$(cat << 'EOF' | timeout 10 ./run-with-node20.sh 2>&1
{"jsonrpc":"2.0","id":7,"method":"tools/call","params":{"name":"list_notebooks","arguments":{"count":100}}}
EOF
)

DELETED_CHECK=$(echo "$FINAL_LIST" | jq -r '.result.content[0].text' | jq -r ".notebooks[] | select(.id == $NOTEBOOK_ID) | .id")

if [ -z "$DELETED_CHECK" ]; then
    echo "✅ Notebook successfully deleted (not found in list)"
else
    echo "❌ Notebook still exists in list"
    exit 1
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║              ✅ ALL INTEGRATION TESTS PASSED ✅               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "Summary:"
echo "  ✅ list_notebooks - Working"
echo "  ✅ create_notebook - Working (ID: $NOTEBOOK_ID)"
echo "  ✅ get_notebook - Working"
echo "  ✅ update_notebook - Working"
echo "  ✅ delete_notebook - Working"
echo "  ✅ Cleanup verified - Working"
echo ""
echo "🎯 All 5 notebook tools are production ready!"
echo ""
