# Quick Start Guide: Datadog MCP Server with Claude Code + Z.AI GLM 4.7 Flash

This guide shows you how to set up and use the Datadog MCP Server with Claude Code, powered by Z.AI's free GLM 4.7 Flash model.

---

## Prerequisites

- Ubuntu system (or similar Linux distribution) or macOS
- Datadog account with API and Application keys ([Get keys](https://app.datadoghq.com/organization-settings/api-keys))
- Z.AI account (free tier available at https://z.ai)
- Node.js 20+ and npm

---

## Quick Command Reference

**One-liner setup** (after cloning repo):

```bash
cd ~/mcp-server-datadog && bash scripts/quickstart-setup.sh
```

**Individual setup steps**:

```bash
# 1. Clone repository
git clone https://github.com/nuttea/mcp-server-datadog ~/mcp-server-datadog

# 2. Set up Datadog credentials (auto-detects existing)
bash ~/mcp-server-datadog/scripts/setup-datadog-env.sh

# 3. Configure Claude Code MCP (auto-builds if needed)
bash ~/mcp-server-datadog/scripts/setup-claude-mcp.sh

# 4. Set up Z.AI token (run separately)
curl -O "https://cdn.bigmodel.cn/install/claude_code_zai_env.sh" && bash ./claude_code_zai_env.sh
```

**Verify setup**:

```bash
# Check credentials
echo $DATADOG_API_KEY

# Test MCP server
claude  # Type: "List all available MCP tools"
```

---

## TL;DR - Automated Setup

**Quick start for experienced users:**

```bash
cd ~/mcp-server-datadog && bash scripts/quickstart-setup.sh
```

This intelligent script will:

- ✅ **Detect existing credentials** and offer to reuse them
- ✅ **Auto-install dependencies** (pnpm install)
- ✅ **Build the MCP server** (if not already built)
- ✅ **Configure Claude Code** with MCP server
- ✅ **Add GLM 4.7 Flash model mappings**

**New features:**

- 🔍 Detects if you've already set up credentials
- 📦 Automatically installs node_modules if missing
- 🚀 Skip re-entering credentials on subsequent runs

Then follow **Step 4** (Install Claude Code) and **Step 5.1** (Z.AI API token).

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

### 5.2 Add MCP Server Configuration

Add the Datadog MCP server to your Claude Code configuration automatically:

**Option 1: Automated setup (recommended)**

```bash
cd ~/mcp-server-datadog
bash scripts/setup-claude-mcp.sh
```

This intelligent script will:

- 🔍 **Auto-detect** if MCP server is built
- 🛠️ **Offer to build** if not found (includes `pnpm install`)
- 🔑 **Detect Datadog credentials** and show status
- 📝 **Create or update** `~/.claude/settings.json`
- 🎯 **Add Datadog MCP server** configuration
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

✓ Updated settings.json with Datadog MCP server
✓ Updated model mappings for GLM 4.7 Flash

✅ Configuration file is valid JSON
```

**Option 2: Manual setup with jq**

If you prefer manual setup or need to customize:

```bash
# Install jq if not available
sudo apt-get install -y jq  # Ubuntu/Debian
# or: brew install jq  # macOS

# Get the MCP server path
MCP_PATH="$HOME/mcp-server-datadog/build/index.js"

# Create or update settings.json
mkdir -p ~/.claude
if [ -f ~/.claude/settings.json ]; then
  # Update existing file
  jq '.mcpServers.datadog = {
    "command": "node",
    "args": ["'$MCP_PATH'"],
    "env": {
      "DATADOG_API_KEY": "${DATADOG_API_KEY}",
      "DATADOG_APP_KEY": "${DATADOG_APP_KEY}",
      "DATADOG_SITE": "${DATADOG_SITE}"
    }
  } | .env.ANTHROPIC_DEFAULT_HAIKU_MODEL = "glm-4.7-flash" |
      .env.ANTHROPIC_DEFAULT_SONNET_MODEL = "glm-4.7-flash" |
      .env.ANTHROPIC_DEFAULT_OPUS_MODEL = "glm-4.7-flash"' \
    ~/.claude/settings.json > ~/.claude/settings.json.tmp
  mv ~/.claude/settings.json.tmp ~/.claude/settings.json
else
  # Create new file
  cat > ~/.claude/settings.json <<EOF
{
  "env": {
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.7-flash",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7-flash",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.7-flash"
  },
  "mcpServers": {
    "datadog": {
      "command": "node",
      "args": ["$MCP_PATH"],
      "env": {
        "DATADOG_API_KEY": "\${DATADOG_API_KEY}",
        "DATADOG_APP_KEY": "\${DATADOG_APP_KEY}",
        "DATADOG_SITE": "\${DATADOG_SITE}"
      }
    }
  }
}
EOF
fi
```

**Option 3: Project-level configuration (for this repository)**

If you're working within this repository and want project-specific MCP configuration:

**Automated (recommended for project-level):**

```bash
cd ~/mcp-server-datadog
bash scripts/setup-project-mcp.sh
```

**Manual setup:**

```bash
# Create .mcp.json in your project directory
cd ~/mcp-server-datadog

cat > .mcp.json <<EOF
{
  "mcpServers": {
    "datadog-local-mcp": {
      "command": "$(pwd)/run-with-node20.sh",
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

**Configuration Levels Explained**:

- **Global**: `~/.claude/settings.json` - Applies to all projects (Options 1 & 2)
- **Project**: `.mcp.json` + `.claude/settings.local.json` - Applies only to this project (Option 3)
- Project-level settings override global settings when working in that directory
- For detailed comparison, see [MCP_CONFIGURATION.md](./MCP_CONFIGURATION.md)

**Notes**:

- ✅ **Option 1 script features**:
  - Auto-installs dependencies (`pnpm install`) if `node_modules` missing
  - Auto-builds server if `build/` doesn't exist
  - Detects and displays existing Datadog credentials
  - Adds GLM 4.7 Flash model mappings automatically
- 📂 For **global config**: use Option 1 (affects all projects)
- 📁 For **project-level**: use Option 3 (only this project)
- 🔑 MCP server inherits Datadog credentials from your shell environment
- ⚠️ **Important**: Ensure Datadog environment variables (Step 3) are set before starting Claude Code

---

## Step 6: Verify Setup

Test that everything is working:

```bash
# Start Claude Code
claude

# In the Claude Code prompt, type:
# "List all available MCP tools"
```

You should see 32 Datadog tools available, including:

- `mcp__datadog-local-mcp__get_monitors`
- `mcp__datadog-local-mcp__get_service_stats_realtime`
- `mcp__datadog-local-mcp__create_notebook`
- And many more...

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
