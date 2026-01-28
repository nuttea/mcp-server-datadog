# Quick Start Guide: Datadog MCP Server with Claude Code + Z.AI GLM 4.7 Flash

This guide shows you how to set up and use the Datadog MCP Server with Claude Code, powered by Z.AI's free GLM 4.7 Flash model.

**⚠️ IMPORTANT**: This guide uses **PROJECT-LEVEL** configuration. You must start Claude Code from the project directory.

---

## Prerequisites

- Ubuntu system (or similar Linux distribution) or macOS
- Datadog account with API and Application keys ([Get keys](https://app.datadoghq.com/organization-settings/api-keys))
- Z.AI account (free tier available at https://z.ai)
- **For complete setup**: Nothing! Script installs NVM, Node, pnpm
- **For quick setup**: Node.js 20+ and pnpm

---

## 🚀 Quick Command Reference

### Option 1: Complete End-to-End Setup (RECOMMENDED)

**Installs EVERYTHING** (NVM, Node 20, pnpm, dependencies, builds, configures, Z.AI):

```bash
git clone https://github.com/nuttea/mcp-server-datadog ~/mcp-server-datadog
cd ~/mcp-server-datadog
bash scripts/complete-setup.sh
```

✨ **Perfect for first-time setup!** Includes:

- All prerequisites (NVM, Node, pnpm)
- Z.AI API token setup (opens browser for you)
- Project-level configuration

### Option 2: Quick Setup (Node/pnpm already installed)

```bash
git clone https://github.com/nuttea/mcp-server-datadog ~/mcp-server-datadog
cd ~/mcp-server-datadog
bash scripts/quickstart-setup.sh
```

📋 **Requires**: Node.js 20+ and pnpm already installed.
🎯 **Includes**: Z.AI API token setup (interactive)

### Individual Setup Commands

```bash
# 1. Clone repository
git clone https://github.com/nuttea/mcp-server-datadog ~/mcp-server-datadog
cd ~/mcp-server-datadog

# 2. OPTION A: Complete setup (INCLUDES Z.AI - recommended)
bash scripts/complete-setup.sh

# 2. OPTION B: Quick setup (INCLUDES Z.AI - if Node/pnpm installed)
bash scripts/quickstart-setup.sh

# 2. OPTION C: Manual step-by-step:
bash scripts/setup-datadog-env.sh          # Datadog credentials
pnpm install && pnpm build                  # Build project
bash scripts/setup-project-mcp.sh          # Claude Code config

# Get Z.AI API key: https://z.ai/manage-apikey/apikey-list
curl -O "https://cdn.bigmodel.cn/install/claude_code_zai_env.sh" && bash ./claude_code_zai_env.sh

# 3. Install Claude Code CLI (if not installed)
npm install -g @anthropic/claude-code

# 4. Start Claude Code from project directory
cd ~/mcp-server-datadog
claude
```

**Note**: Options A and B now include Z.AI setup automatically!

### Verify Setup

```bash
# Check credentials
echo $DATADOG_API_KEY

# Check project config files
ls -la .mcp.json .claude/settings.local.json

# Test MCP server (run from project directory)
cd ~/mcp-server-datadog
claude  # Type: "List all available MCP tools"
```

---

## TL;DR - Automated Setup

### 🎯 Complete End-to-End Setup (RECOMMENDED)

**For first-time users - ONE SCRIPT installs EVERYTHING:**

```bash
git clone https://github.com/nuttea/mcp-server-datadog ~/mcp-server-datadog
cd ~/mcp-server-datadog
bash scripts/complete-setup.sh
```

This comprehensive script installs and configures **all 7 steps**:

1. ✅ **NVM** (Node Version Manager)
2. ✅ **Node.js 20**
3. ✅ **pnpm** package manager
4. ✅ **Datadog credentials** (interactive setup with detection)
5. ✅ **Dependencies** (pnpm install)
6. ✅ **MCP server build**
7. ✅ **Claude Code** (project-level configuration)
8. ✅ **Z.AI API token** (interactive setup)
9. ✅ **GLM 4.7 Flash** model mappings

**What the script does for Z.AI:**

- 🌐 Opens https://z.ai/manage-apikey/apikey-list in your browser
- ⏸️ Waits for you to copy your API key
- 📥 Automatically downloads Z.AI setup script
- ⚙️ Runs setup and configures GLM 4.7 Flash model

**Configuration type: PROJECT LEVEL**

- Creates `.mcp.json` in project root
- Creates `.claude/settings.local.json` in project
- ⚠️ **Claude Code must be run from project directory**

**After setup completes:**

```bash
cd ~/mcp-server-datadog
claude  # Start Claude Code
# Type: "List all available MCP tools"
```

⏱️ **Total time: 5-10 minutes** (mostly waiting for downloads and reading prompts)

**For detailed step-by-step instructions, continue below.**

---

## Step 1: Install Node.js 20 via NVM

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell configuration
source ~/.bashrc

# Install Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verify installation
node --version  # Should show v20.x.x
```

---

## Step 2: Clone Repository and Install pnpm

```bash
# Install pnpm globally
npm install -g pnpm

# Clone the MCP server repository
cd ~
git clone https://github.com/nuttea/mcp-server-datadog
cd mcp-server-datadog
```

**Note:** The setup scripts (used in later steps) will automatically:

- Install dependencies with `pnpm install` if `node_modules` is missing
- Build the server with `pnpm build` if `build/` doesn't exist

**Manual build (optional):**

```bash
# Only if you want to build manually now
pnpm install
pnpm build

# Verify build succeeded
ls -la build/index.js  # Should exist
```

---

## Step 3: Configure Datadog Credentials

### Get Your Datadog Keys

1. Go to https://app.datadoghq.com/organization-settings/api-keys
2. Create or copy your API Key
3. Go to https://app.datadoghq.com/organization-settings/application-keys
4. Create or copy your Application Key

### Run Interactive Setup Script

The setup script now includes **intelligent credential detection**:

**Option 1: From the repository (recommended)**

```bash
cd ~/mcp-server-datadog
bash scripts/setup-datadog-env.sh
```

**Option 2: Download and run directly**

```bash
curl -s https://raw.githubusercontent.com/nuttea/mcp-server-datadog/main/scripts/setup-datadog-env.sh | bash
```

**What the script does:**

1. 🔍 **Detects existing credentials** in environment
   - If found: Offers to reuse them (default: Yes)
   - Shows masked credentials for verification
2. 💾 **Saves to shell config** (.bashrc or .zshrc)
   - Auto-detects your shell
   - Adds export statements
   - Backs up existing config if overwriting
3. ✅ **Optional API test** to verify credentials work
4. 📝 **Lists common Datadog sites** for easy selection

**Example output:**

```
✅ Found existing credentials in environment:
   API Key: f32d212e49***
   App Key: 5835119dd2***
   Site: datadoghq.com

Use existing credentials? (Y/n): y
✅ Using existing credentials
✅ Credentials already configured in ~/.bashrc

Test Datadog API connection? (y/N): y
Testing Datadog API connection...
✅ Connection successful! Your credentials are valid.
```

**Common Datadog Sites:**

- `datadoghq.com` - US1 (default)
- `datadoghq.eu` - EU
- `us3.datadoghq.com` - US3
- `us5.datadoghq.com` - US5
- `ap1.datadoghq.com` - AP1
- `ddog-gov.com` - US1-FED

**After setup:**

```bash
# Apply credentials to current session
source ~/.bashrc  # or source ~/.zshrc
```

---

## Step 4: Install Claude Code

```bash
# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Verify installation
claude --version
```

---

## Step 5: Configure Claude Code for Z.AI

### 5.1 Get Z.AI API Token and Configure Environment

Run the automated setup script to configure Z.AI with Claude Code:

```bash
# Download and run the Z.AI setup script
curl -O "https://cdn.bigmodel.cn/install/claude_code_zai_env.sh" && bash ./claude_code_zai_env.sh
```

This script will:

- Set up your Z.AI API token automatically
- Configure Claude Code to use Z.AI as the model provider
- Set up GLM 4.7 Flash as the default model

### 5.2 Configure Claude Code (Project Level)

**⚠️ IMPORTANT**: This guide uses **PROJECT-LEVEL** configuration. Claude Code must be started from the project directory.

Add the Datadog MCP server to your project configuration:

**Automated Setup (RECOMMENDED)**:

```bash
cd ~/mcp-server-datadog
bash scripts/setup-project-mcp.sh
```

This intelligent script will:

- 🔍 **Auto-detect** if MCP server is built
- 🛠️ **Auto-install** dependencies and build if needed
- 🔑 **Detect Datadog credentials** and show status
- 📝 **Create** `.mcp.json` in project root
- 📁 **Create** `.claude/settings.local.json` with project settings
- ✨ **Configure GLM 4.7 Flash** model mappings (haiku, sonnet, opus)
- 💾 **Preserve existing settings** (with backup)
- ✅ **Validate configuration** (JSON syntax check)

**Example output:**

```
✓ Found MCP server at: /Users/you/mcp-server-datadog/build/index.js

✓ Found Datadog credentials:
  API Key: f32d212e49***
  App Key: 5835119dd2***
  Site: datadoghq.com

✓ Created .mcp.json
✓ Created .claude/settings.local.json

✅ Configuration file is valid JSON
```

**Files Created:**

- `.mcp.json` - MCP server configuration
- `.claude/settings.local.json` - Project settings with GLM 4.7 Flash mappings

**Manual Setup (Advanced)**:

```bash
cd ~/mcp-server-datadog

# Create .mcp.json
cat > .mcp.json <<EOF
{
  "mcpServers": {
    "datadog-local-mcp": {
      "command": "$(pwd)/scripts/run-with-node20.sh",
      "env": {
        "DATADOG_API_KEY": "\${DATADOG_API_KEY}",
        "DATADOG_APP_KEY": "\${DATADOG_APP_KEY}",
        "DATADOG_SITE": "\${DATADOG_SITE}"
      }
    }
  }
}
EOF

# Create or update .claude/settings.local.json
mkdir -p .claude
cat > .claude/settings.local.json <<EOF
{
  "env": {
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.7-flash",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7-flash",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.7-flash"
  },
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": ["datadog-local-mcp"]
}
EOF

echo "✅ Project-level MCP configuration created"
```

**Configuration Type: PROJECT LEVEL** 🎯

This guide uses **project-level** configuration (recommended):

- ✅ **Isolated**: Configuration only applies to this project
- ✅ **Version-controlled**: `.mcp.json` can be committed to git
- ✅ **No conflicts**: Won't affect other projects
- ⚠️ **Must run from project directory**: `cd ~/mcp-server-datadog && claude`

For global configuration (all projects), see [MCP_CONFIGURATION.md](./MCP_CONFIGURATION.md)

**Script Features**:

- ✅ Auto-installs dependencies (`pnpm install`) if `node_modules` missing
- ✅ Auto-builds server if `build/` doesn't exist
- ✅ Detects and displays existing Datadog credentials
- ✅ Creates `.mcp.json` and `.claude/settings.local.json`
- ✅ Adds GLM 4.7 Flash model mappings automatically
- ✅ Validates JSON configuration

**Important**:

- 🔑 MCP server inherits Datadog credentials from your shell environment
- 📂 Always start Claude Code from the project directory
- ⚠️ Ensure Datadog environment variables (Step 3) are set before starting

---

## Step 6: Verify Setup

**⚠️ CRITICAL**: Start Claude Code from the project directory for project-level config:

```bash
# Navigate to project directory
cd ~/mcp-server-datadog

# Start Claude Code
claude

# In the Claude Code prompt, type:
# "List all available MCP tools"
```

**Expected Result**: You should see 32 Datadog tools available:

- `mcp__datadog-local-mcp__get_monitors`
- `mcp__datadog-local-mcp__get_service_stats_realtime`
- `mcp__datadog-local-mcp__create_notebook`
- `mcp__datadog-local-mcp__list_slos`
- `mcp__datadog-local-mcp__get_service_endpoints`
- And 27 more tools...

**Troubleshooting**:

- If tools don't appear, check you're in the project directory: `pwd`
- Verify config files exist: `ls -la .mcp.json .claude/settings.local.json`
- Check Claude Code logs: `tail -f ~/.claude/logs/mcp-*.log`

---

## Example Usage Prompts

### 1. Explore Monitors

```
Analyze my Datadog monitors and provide insights:

1. Get all monitors and show me:
   - Total count of monitors
   - Breakdown by status (Alert, Warn, OK, No Data)
   - Top 5 most critical monitors currently alerting
   - Monitors grouped by service or team tags

2. Identify any monitors that:
   - Are in No Data state (might indicate issues)
   - Have been alerting for more than 24 hours
   - Are muted

Provide a summary table and recommendations for monitor health.
```

### 2. Define SLI/SLO from Current Observability Data

```
Help me define SLIs and SLOs for my production services:

1. List all services in my Datadog environment
2. For each service, analyze APM data from the past 7 days:
   - Request rate (requests per second)
   - Error rate percentage
   - Latency percentiles (p50, p75, p95, p99)
   - Identify top 5 slowest endpoints

3. Based on the data, recommend SLIs and SLO targets:
   - Availability SLI (error rate based)
   - Latency SLI (p95 or p99 based)
   - Suggest realistic SLO targets (e.g., 99.9% availability, p95 < 200ms)

4. For my top 3 most critical services, provide:
   - Current performance vs recommended SLOs
   - Error budget calculations
   - Which endpoints need improvement

Present findings in a structured format with tables and actionable recommendations.
```

### 3. Create Datadog Notebook with SLI/SLO Graphs

```
Create a comprehensive SLI/SLO monitoring notebook in Datadog:

1. First, analyze my top 5 services and their performance metrics (past 7 days)

2. Create a Datadog notebook titled "SLI/SLO Dashboard - [Current Date]" with:

   ## Introduction Section (Markdown)
   - Overview of SLI/SLO monitoring
   - List of services covered
   - SLO targets defined

   ## Per-Service Sections
   For each of my top 5 services, include:

   ### Service: [service_name]

   **Availability SLI** (Markdown + Metric Graph)
   - Graph: Error rate over time (past 7 days)
   - SLO Target: 99.9% (0.1% error budget)

   **Latency SLI** (Markdown + Metric Graph)
   - Graph: p95 and p99 latency over time (past 7 days)
   - SLO Target: p95 < 200ms, p99 < 500ms

   **Request Volume** (Metric Graph)
   - Graph: Requests per second over time

   **Error Logs Sample** (Logs Query)
   - Recent error logs for this service (last 1 hour)

   ## Summary Section (Markdown)
   - Table of all services with current SLI compliance
   - Error budget remaining for each service
   - Action items and alerts to set up

3. After creating the notebook, provide me with:
   - Direct link to the notebook
   - Summary of what was included
   - Next steps for setting up SLO monitors

Use actual metric queries with proper aggregations and time ranges.
```

### 4. Quick Health Check

```
Run a comprehensive health check of my Datadog environment:

1. Check monitor status - any critical alerts?
2. Review service performance - any degraded services?
3. Check recent incidents - any active or unresolved?
4. Review SLO compliance - are we meeting targets?
5. Analyze error patterns in logs (last 1 hour)

Provide a 1-5 health score and top 3 action items.
```

---

## Using Built-in Skills

This MCP server includes 4 specialized skills that you can invoke:

### 1. Health Check

```
/datadog-healthcheck

Analyze my entire Datadog account health and provide a 100-point score with recommendations.
```

### 2. SLI/SLO Analysis

```
/datadog-sli-slo-analysis

For service "my-api-service", analyze APM data and recommend SLI/SLO targets with performance baselines.
```

### 3. Tagging Strategy

```
/datadog-tagging-strategy

Audit my tagging compliance across infrastructure, services, monitors, and logs. Identify gaps and recommend improvements.
```

### 4. Usage Attribution

```
/datadog-usage-attribution

Analyze Datadog usage and costs. Recommend optimal tags for chargeback and identify top resource consumers by team/service.
```

---

## Tips for Best Results with GLM 4.7 Flash

1. **Be Specific**: The model works best with clear, structured requests
2. **Break Down Complex Tasks**: Split large analyses into steps
3. **Use Time Ranges**: Always specify time ranges (e.g., "past 7 days", "last 1 hour")
4. **Request Summaries**: Ask for tables, bullet points, or structured output
5. **Iterate**: Start with exploratory questions, then drill down into specifics

---

## Troubleshooting

### Setup Script Issues

**Credentials Already Exist**

```bash
# Script detects existing credentials and offers to reuse them
# If you want to enter NEW credentials, answer "n" when prompted:
# Use existing credentials? (Y/n): n

# To clear and re-enter credentials:
# Edit your shell config and remove the Datadog lines
nano ~/.bashrc  # or ~/.zshrc

# Or re-run the script and choose to overwrite
bash scripts/setup-datadog-env.sh
```

**Dependencies Not Installing**

```bash
# Manually install dependencies
cd ~/mcp-server-datadog
pnpm install

# Or reinstall pnpm
npm uninstall -g pnpm
npm install -g pnpm
```

**Build Failing**

```bash
# Clean and rebuild
cd ~/mcp-server-datadog
rm -rf build node_modules
pnpm install
pnpm build
```

**Credentials Not Loading**

```bash
# Make sure to source your shell config after setup
source ~/.bashrc  # or source ~/.zshrc

# Or restart your terminal

# Verify credentials are loaded
echo $DATADOG_API_KEY
echo $DATADOG_APP_KEY
```

### MCP Server Not Showing Tools

```bash
# Verify MCP configuration
jq '.mcpServers.datadog' ~/.claude/settings.json

# Check if MCP server build exists
ls -la ~/mcp-server-datadog/build/index.js

# Check Claude Code logs
tail -f ~/.claude/logs/mcp-*.log

# Test MCP server directly
cd ~/mcp-server-datadog
node build/index.js

# Rebuild the server
cd ~/mcp-server-datadog
pnpm build

# Re-run the setup
bash scripts/setup-claude-mcp.sh
```

### Datadog API Errors

```bash
# Verify credentials
echo $DATADOG_API_KEY
echo $DATADOG_APP_KEY

# Test API access
curl -X GET "https://api.datadoghq.com/api/v1/validate" \
  -H "DD-API-KEY: ${DATADOG_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DATADOG_APP_KEY}"
```

### Z.AI Connection Issues

- Verify your token is active at https://z.ai/dashboard
- Check that `ANTHROPIC_BASE_URL` is set correctly
- Ensure you're not hitting rate limits (free tier restrictions)

---

## What's Next?

1. **Explore Your Data**: Start with simple queries to understand your environment
2. **Set Up SLOs**: Use the SLI/SLO analysis skill to establish baselines
3. **Create Dashboards**: Build notebooks for team visibility
4. **Automate Monitoring**: Set up monitors based on insights
5. **Share Results**: Export notebooks and share with your team

---

## Resources

- **Datadog MCP Server Docs**: [README.md](./README.md)
- **Claude Code Docs**: https://docs.anthropic.com/claude/docs/claude-code
- **Z.AI Documentation**: https://docs.z.ai/
- **Datadog API Docs**: https://docs.datadoghq.com/api/
- **Agent Guide**: [CLAUDE-DATADOG.md](./CLAUDE-DATADOG.md)
- **Skills Guide**: See `.claude/skills/` directory

---

## Support

- **Issues**: https://github.com/DataDog/mcp-server-datadog/issues
- **Datadog Support**: https://help.datadoghq.com/
- **Z.AI Support**: https://z.ai/support

---

**Happy Monitoring! 🚀📊**
