# MCP Server Configuration Guide

This guide explains the different ways to configure the Datadog MCP server with Claude Code.

---

## Configuration Levels

### 1. **Global Configuration** (User-level)

**Location**: `~/.claude/settings.json`

**Use when**: You want the MCP server available in all projects

**Setup**:

```bash
cd ~/mcp-server-datadog
bash scripts/setup-claude-mcp.sh
```

**Configuration**:

```json
{
  "env": {
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.7-flash",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7-flash",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.7-flash"
  },
  "mcpServers": {
    "datadog": {
      "command": "node",
      "args": ["$HOME/mcp-server-datadog/build/index.js"],
      "env": {
        "DATADOG_API_KEY": "${DATADOG_API_KEY}",
        "DATADOG_APP_KEY": "${DATADOG_APP_KEY}",
        "DATADOG_SITE": "${DATADOG_SITE}"
      }
    }
  }
}
```

**Pros**:

- ✅ Available everywhere
- ✅ One-time setup
- ✅ Easy to manage

**Cons**:

- ❌ Not version controlled
- ❌ Same config for all projects
- ❌ Requires absolute paths

---

### 2. **Project-Level Configuration**

**Location**: `.mcp.json` + `.claude/settings.local.json`

**Use when**: You want project-specific MCP configuration

**Setup**:

```bash
cd ~/mcp-server-datadog
bash scripts/setup-project-mcp.sh
```

**Configuration**:

**.mcp.json** (in project root):

```json
{
  "mcpServers": {
    "datadog-local-mcp": {
      "command": "/path/to/mcp-server-datadog/scripts/run-with-node20.sh",
      "env": {
        "DATADOG_API_KEY": "${DATADOG_API_KEY}",
        "DATADOG_APP_KEY": "${DATADOG_APP_KEY}",
        "DATADOG_SITE": "${DATADOG_SITE}"
      }
    }
  }
}
```

**.claude/settings.local.json**:

```json
{
  "env": {
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.7-flash",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7-flash",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.7-flash"
  },
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": ["datadog-local-mcp"]
}
```

**Pros**:

- ✅ Project-specific configuration
- ✅ Can be version controlled (.mcp.json)
- ✅ Overrides global settings
- ✅ Relative paths possible

**Cons**:

- ❌ Needs setup per project
- ❌ .claude/settings.local.json not version controlled (gitignored)

---

## Configuration Priority

When Claude Code starts in a directory:

1. **First**: Checks for `.mcp.json` in current directory (project-level)
2. **Then**: Checks for `~/.claude/settings.json` (global)
3. **Merges**: Settings from both (project settings override global)

---

## Scripts Available

### Setup Scripts

| Script                 | Purpose                                       | Output                                      |
| ---------------------- | --------------------------------------------- | ------------------------------------------- |
| `setup-datadog-env.sh` | Configure Datadog credentials                 | `~/.bashrc` or `~/.zshrc`                   |
| `setup-claude-mcp.sh`  | Global MCP configuration                      | `~/.claude/settings.json`                   |
| `setup-project-mcp.sh` | Project MCP configuration                     | `.mcp.json` + `.claude/settings.local.json` |
| `quickstart-setup.sh`  | All-in-one (credentials + build + global MCP) | Multiple files                              |

### Quick Commands

```bash
# Full setup (global)
cd ~/mcp-server-datadog
bash scripts/quickstart-setup.sh

# Just Datadog credentials
bash scripts/setup-datadog-env.sh

# Just global MCP config
bash scripts/setup-claude-mcp.sh

# Just project-level MCP config
bash scripts/setup-project-mcp.sh
```

---

## File Locations Reference

### Global Files

```
~/.claude/
├── settings.json          # Global Claude Code settings
└── logs/
    └── mcp-*.log         # MCP server logs
```

### Project Files (this repository)

```
mcp-server-datadog/
├── .mcp.json             # Project MCP server config (can be version controlled)
├── .claude/
│   └── settings.local.json  # Project Claude settings (gitignored)
├── build/
│   └── index.js          # Compiled MCP server
└── scripts/
    ├── run-with-node20.sh    # Node wrapper script
    ├── setup-datadog-env.sh  # Datadog credentials
    ├── setup-claude-mcp.sh   # Global MCP config
    └── setup-project-mcp.sh  # Project MCP config
```

---

## Environment Variables

Both configurations use these environment variables:

```bash
export DATADOG_API_KEY="your_api_key"
export DATADOG_APP_KEY="your_app_key"
export DATADOG_SITE="datadoghq.com"  # or datadoghq.eu, us3.datadoghq.com, etc.
```

Set them with:

```bash
bash scripts/setup-datadog-env.sh
```

---

## Troubleshooting

### MCP Server Not Loading

**Check configuration exists:**

```bash
# Global
jq '.mcpServers' ~/.claude/settings.json

# Project
jq '.mcpServers' .mcp.json
cat .claude/settings.local.json
```

**Verify MCP server is built:**

```bash
ls -la ~/mcp-server-datadog/build/index.js
```

**Check logs:**

```bash
tail -f ~/.claude/logs/mcp-*.log
```

**Test server directly:**

```bash
cd ~/mcp-server-datadog
node build/index.js
```

### Credentials Not Working

**Verify environment variables:**

```bash
echo $DATADOG_API_KEY
echo $DATADOG_APP_KEY
echo $DATADOG_SITE
```

**Test API connection:**

```bash
curl -X GET "https://api.${DATADOG_SITE}/api/v1/validate" \
  -H "DD-API-KEY: ${DATADOG_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DATADOG_APP_KEY}"
```

**Re-run credentials setup:**

```bash
bash scripts/setup-datadog-env.sh
source ~/.bashrc  # or ~/.zshrc
```

---

## Recommended Setup

**For end users** (using the MCP server in their projects):

- Use **global configuration** (Option 1 in QUICKSTART.md)
- Run: `bash scripts/setup-claude-mcp.sh`

**For this repository developers**:

- Use **project-level configuration** (Option 3 in QUICKSTART.md)
- Run: `bash scripts/setup-project-mcp.sh`
- Commit `.mcp.json` to version control
- Keep `.claude/settings.local.json` gitignored

---

## See Also

- [QUICKSTART.md](./QUICKSTART.md) - Full setup guide
- [README.md](./README.md) - MCP server documentation
- [Claude Code Docs](https://docs.anthropic.com/claude/docs/claude-code)
