# Datadog MCP Server - Scripts

Automation and setup scripts for integrating the Datadog MCP Server with various AI assistants and tools.

---

## 🚀 Quick Setup (Platform-Specific)

Choose your platform and run the corresponding setup script:

| Platform           | Script                    | Config Location                      | Command                               |
| ------------------ | ------------------------- | ------------------------------------ | ------------------------------------- |
| **Kiro CLI**       | setup-kiro-datadog-mcp.sh | Kiro registry                        | `./scripts/setup-kiro-datadog-mcp.sh` |
| **Claude Desktop** | setup-claude-desktop.sh   | ~/Library/Application Support/Claude | `./scripts/setup-claude-desktop.sh`   |
| **Gemini CLI**     | setup-gemini-cli.sh       | ~/.gemini/config.json                | `./scripts/setup-gemini-cli.sh`       |
| **Cursor IDE**     | setup-cursor.sh           | ~/.cursor/mcp.json                   | `./scripts/setup-cursor.sh`           |
| **Continue.dev**   | setup-continue.sh         | ~/.continue/config.json              | `./scripts/setup-continue.sh`         |

**All scripts**:

- ✅ Load credentials from `.env`
- ✅ Validate API keys
- ✅ Configure MCP server automatically
- ✅ Provide next steps

---

## 📋 Setup Scripts

### setup-kiro-datadog-mcp.sh

One-command setup for Kiro CLI integration.

**Features**:

- Loads DD_API_KEY and DD_APP_KEY from .env
- Removes old server if exists
- Adds new server with credentials
- Uses run-with-node20.sh for compatibility

**Usage**:

```bash
./scripts/setup-kiro-datadog-mcp.sh
```

**Output**:

```
✅ Datadog MCP Server configured for Kiro CLI!

Test it:
  kiro-cli
  > "List available Datadog tools"
```

---

### setup-claude-desktop.sh

Configure Claude Desktop to use the Datadog MCP Server.

**Config File**: `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac)

**Usage**:

```bash
./scripts/setup-claude-desktop.sh
```

**Next Steps**:

1. Restart Claude Desktop
2. Ask: "List my Datadog monitors"

---

### setup-gemini-cli.sh

Configure Google's Gemini CLI with Datadog MCP Server.

**Config File**: `~/.gemini/config.json`

**Usage**:

```bash
./scripts/setup-gemini-cli.sh
```

**Next Steps**:

1. Restart Gemini CLI
2. Ask: "List my Datadog notebooks"

---

### setup-cursor.sh

Configure Cursor IDE with Datadog MCP Server.

**Config File**: `~/.cursor/mcp.json`

**Usage**:

```bash
./scripts/setup-cursor.sh
```

**Next Steps**:

1. Restart Cursor IDE
2. Open Cursor Settings → MCP
3. Ask Cursor AI: "List Datadog monitors"

---

### setup-continue.sh

Configure Continue.dev extension with Datadog MCP Server.

**Config File**: `~/.continue/config.json`

**Usage**:

```bash
./scripts/setup-continue.sh
```

**Next Steps**:

1. Restart VS Code
2. Open Continue.dev extension
3. Ask: "List Datadog notebooks"

---

## 🔧 Runtime Scripts

### run-with-node20.sh

Ensures the MCP server runs with Node 20.x for compatibility.

**Used by**: All setup scripts
**Purpose**: Handles Node version management

**Direct usage**:

```bash
./run-with-node20.sh < input.json > output.json
```

### run-with-node20-debug.sh

Debug version with verbose logging.

**Log file**: `/tmp/datadog-mcp-debug.log`

**Usage**:

```bash
./scripts/run-with-node20-debug.sh
# Check logs: tail -f /tmp/datadog-mcp-debug.log
```

---

## 🧪 Testing Scripts

### test-notebooks-integration.sh ⭐ NEW!

Comprehensive integration tests for Datadog Notebook tools.

**Tests**:

1. List existing notebooks
2. Create test notebook
3. Get specific notebook
4. Update notebook content
5. Verify update
6. Delete notebook
7. Verify deletion

**Usage**:

```bash
./scripts/test-notebooks-integration.sh
```

**Output**:

```
✅ ALL INTEGRATION TESTS PASSED ✅

Summary:
  ✅ list_notebooks - Working
  ✅ create_notebook - Working (ID: 240383)
  ✅ get_notebook - Working
  ✅ update_notebook - Working
  ✅ delete_notebook - Working
  ✅ Cleanup verified - Working
```

### test-datadog-auth.sh

Verify Datadog API credentials are valid.

**Usage**:

```bash
./scripts/test-datadog-auth.sh
```

**Checks**:

- DD_API_KEY exists and valid
- DD_APP_KEY exists and valid
- Can connect to Datadog API
- Returns account info

---

## 🛠️ Utility Scripts

### add-mcp-server.sh

Universal script to add any MCP server (not just Datadog).

**Usage**:

```bash
./scripts/add-mcp-server.sh [client] [name] [command] [env-json]
```

**Example**:

```bash
./scripts/add-mcp-server.sh kiro my-server "./server.sh" '{"KEY":"value"}'
```

### add-remote-mcp.sh

Add Datadog's official remote MCP server.

**Usage**:

```bash
./scripts/add-remote-mcp.sh [gemini|kiro|claude|auto]
```

**Note**: For hosted/remote MCP servers (not local)

---

## 📖 Usage Examples

### Example 1: Setup for Claude Desktop

```bash
# 1. Ensure .env file exists with credentials
cat .env
# DD_API_KEY=your_key
# DD_APP_KEY=your_app_key

# 2. Run setup
./scripts/setup-claude-desktop.sh

# 3. Restart Claude Desktop

# 4. Test
# Ask Claude: "List my Datadog monitors"
```

### Example 2: Setup for Gemini CLI

```bash
# 1. Load credentials
source .env

# 2. Run setup
./scripts/setup-gemini-cli.sh

# 3. Restart Gemini CLI

# 4. Test
# Ask Gemini: "Run health check on my Datadog account"
```

### Example 3: Run Integration Tests

```bash
# Tests all 5 notebook tools
./scripts/test-notebooks-integration.sh

# Output shows:
# ✅ create_notebook - Working
# ✅ list_notebooks - Working
# ✅ get_notebook - Working
# ✅ update_notebook - Working
# ✅ delete_notebook - Working
```

---

## ⚙️ Prerequisites

All scripts require:

- ✅ Node 20+ installed (via nvm: `nvm install 20.19.6`)
- ✅ `.env` file with credentials:
  ```bash
  DD_API_KEY=your_datadog_api_key
  DD_APP_KEY=your_datadog_app_key
  DD_SITE=us3.datadoghq.com  # Optional
  ```
- ✅ Project built: `pnpm install && pnpm build`

---

## 🔍 Troubleshooting

### Script fails with "Node 20 not found"

```bash
# Install Node 20 via nvm
nvm install 20.19.6
nvm use 20.19.6
```

### Script fails with ".env not found"

```bash
# Create .env file
cp .env.example .env
# Edit and add your credentials
vim .env
```

### Script fails with "jq not found"

```bash
# Mac
brew install jq

# Linux
sudo apt-get install jq

# Or follow manual instructions shown by script
```

### MCP server not loading after setup

```bash
# 1. Check config file was created
cat ~/Library/Application Support/Claude/claude_desktop_config.json

# 2. Verify credentials in config
# 3. Restart the application completely
# 4. Check application logs for errors
```

---

## 📚 Script Inventory

| Script                        | Purpose          | Platform       | Status    |
| ----------------------------- | ---------------- | -------------- | --------- |
| setup-kiro-datadog-mcp.sh     | Kiro setup       | Kiro CLI       | ✅ Tested |
| setup-claude-desktop.sh       | Claude setup     | Claude Desktop | ✅ Ready  |
| setup-gemini-cli.sh           | Gemini setup     | Gemini CLI     | ✅ Ready  |
| setup-cursor.sh               | Cursor setup     | Cursor IDE     | ✅ Ready  |
| setup-continue.sh             | Continue setup   | Continue.dev   | ✅ Ready  |
| add-mcp-server.sh             | Universal add    | Any            | ✅ Ready  |
| add-remote-mcp.sh             | Remote server    | Any            | ✅ Ready  |
| run-with-node20.sh            | Runtime          | All            | ✅ Tested |
| run-with-node20-debug.sh      | Debug            | All            | ✅ Ready  |
| test-datadog-auth.sh          | Auth test        | Standalone     | ✅ Ready  |
| test-notebooks-integration.sh | Integration test | Standalone     | ✅ Tested |

**Total**: 11 scripts

---

## 🎯 Recommended Setup Flow

### For First-Time Setup:

**Step 1**: Create .env file

```bash
cat > .env << 'EOF'
DD_API_KEY=your_datadog_api_key_here
DD_APP_KEY=your_datadog_app_key_here
DD_SITE=us3.datadoghq.com
EOF
```

**Step 2**: Build the project

```bash
pnpm install
pnpm build
```

**Step 3**: Test authentication

```bash
./scripts/test-datadog-auth.sh
```

**Step 4**: Choose your platform and run setup

```bash
# For Claude Desktop
./scripts/setup-claude-desktop.sh

# For Gemini CLI
./scripts/setup-gemini-cli.sh

# For Kiro CLI
./scripts/setup-kiro-datadog-mcp.sh

# For Cursor
./scripts/setup-cursor.sh

# For Continue.dev
./scripts/setup-continue.sh
```

**Step 5**: Restart your application

**Step 6**: Test

```
Ask your AI: "List my Datadog monitors"
```

---

## 🧪 Testing

### Quick Test (All Platforms)

After setup, test with:

```
"List my Datadog monitors"
"How many hosts do I have in Datadog?"
"Show me my Datadog SLOs"
"List my Datadog notebooks"
```

### Comprehensive Test

```bash
# Run full integration test suite
./scripts/test-notebooks-integration.sh
```

---

## 📝 Notes

- All setup scripts use absolute paths (work from any directory)
- Scripts detect OS automatically (Mac/Linux)
- jq is optional (scripts provide manual instructions if missing)
- Credentials are loaded from .env (never hardcoded)
- All scripts are idempotent (safe to run multiple times)

---

## 🔄 Updates

To update MCP server after code changes:

```bash
# 1. Build new version
pnpm build

# 2. No need to re-run setup scripts!
# 3. Just restart your application

# 4. Test integration if needed
./scripts/test-notebooks-integration.sh
```

---

**Questions?** Check the main [README.md](../README.md) or [docs/](../docs/) for detailed documentation.
