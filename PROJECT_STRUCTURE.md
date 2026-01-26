# Datadog MCP Server - Project Structure

**Last Updated**: 2026-01-25

This document provides an overview of the project organization and file structure.

---

## 📁 Directory Structure

```
mcp-server-datadog/
├── src/                      # Source code (TypeScript)
│   ├── index.ts             # Main MCP server entry point
│   ├── tools/               # Tool implementations (32 tools)
│   └── utils/               # Shared utilities
│
├── docs/                     # Documentation
│   ├── QUICKSTART.md        # Quick start guide for end users
│   ├── MCP_CONFIGURATION.md # MCP configuration guide
│   ├── TESTING_GUIDE.md     # Testing documentation
│   ├── CLAUDE-DATADOG.md    # Claude agent guide for Datadog
│   ├── HEALTHCHECK_GUIDE.md # Healthcheck skill guide
│   ├── NOTEBOOKS-GUIDE.md   # Notebooks tool guide
│   └── ...                  # Other guides and reports
│
├── scripts/                  # Setup and utility scripts
│   ├── setup-datadog-env.sh    # Interactive Datadog credentials setup
│   ├── setup-claude-mcp.sh     # Global Claude MCP configuration
│   ├── setup-project-mcp.sh    # Project-level MCP configuration
│   ├── quickstart-setup.sh     # All-in-one setup script
│   └── ...                      # Other setup scripts
│
├── tests/                    # Test files
│   ├── test-*.js            # JavaScript test files
│   ├── test-*.sh            # Shell test scripts
│   ├── tools/               # Tool-specific tests
│   └── helpers/             # Test helper utilities
│
├── examples/                 # Example scripts and configurations
│   ├── run-claudecode-*.sh  # Claude Code runner scripts
│   └── update-kiro-debug.sh # Kiro CLI debug script
│
├── .claude/                  # Claude Code project configuration
│   ├── skills/              # Custom Claude skills (4 skills)
│   └── settings.local.json  # Project-level settings (gitignored)
│
├── reports/                  # Assessment reports and templates
│   ├── templates/           # Report templates
│   └── datadog-assessment-* # Generated reports (gitignored)
│
├── notebooks/                # Example notebooks and guides (gitignored)
│
├── build/                    # Compiled JavaScript (gitignored)
│
└── node_modules/             # Dependencies (gitignored)
```

---

## 📄 Root Files

### Core Files

- **README.md** - Main project documentation
- **SECURITY.md** - Security policy and guidelines
- **CLAUDE.md** - Project instructions for Claude Code
- **LICENSE** - MIT License

### Configuration Files

- **package.json** - Project dependencies and scripts
- **tsconfig.json** - TypeScript configuration
- **tsup.config.ts** - Build configuration
- **vitest.config.ts** - Test configuration
- **jest.config.ts** - Jest test configuration
- **eslint.config.js** - Linting configuration
- **smithery.yaml** - Smithery MCP configuration
- **Dockerfile** - Docker containerization

### Execution Scripts

- **run-with-node20.sh** - Node 20 wrapper script (used by MCP server)

### Project Configuration

- **.mcp.json** - Project-level MCP server config (gitignored)
- **.gitignore** - Git ignore patterns

### Temporary/Session Files (Gitignored)

- **SESSION_SUMMARY.md** - Session summaries
- **CLAUDE-FULL.md** - Extended Claude documentation
- **OBSERVABILITY_ISSUES.md** - Working notes (contains examples)
- **query-usage-metrics.md** - Usage queries

---

## 🔧 Source Code Organization

### src/tools/

Each module follows the **3-file pattern**:

- `schema.ts` - Zod validation schemas
- `tool.ts` - Tool implementation
- `index.ts` - Exports

**Modules (32 tools total)**:

1. **incidents** - List/get incidents
2. **logs** - Get logs, list services
3. **metrics** - Query metrics
4. **monitors** - Get monitor status
5. **dashboards** - List/get dashboards
6. **traces** - List APM traces
7. **hosts** - List, count, mute/unmute hosts
8. **downtimes** - Manage scheduled downtimes
9. **rum** - Real User Monitoring
10. **slo** - Service Level Objectives
11. **apm** - APM service statistics and endpoints
12. **notebooks** - Create, list, get, update, delete notebooks

### src/utils/

- API client wrappers
- Validation utilities
- Retry logic
- Logging helpers

---

## 📚 Documentation Organization

### User Guides

- **QUICKSTART.md** - Setup guide for Claude Code + Z.AI + Datadog MCP
- **MCP_CONFIGURATION.md** - Global vs project-level configuration
- **TESTING_GUIDE.md** - How to run and write tests

### Feature Guides

- **HEALTHCHECK_GUIDE.md** - Datadog account health assessment
- **NOTEBOOKS-GUIDE.md** - Creating Datadog notebooks
- **CLAUDE-DATADOG.md** - Claude agent best practices for Datadog

### Reports

- **INTEGRATION_TESTS_REPORT.md** - Integration test results
- **MCP_TOOLS_TEST_SUMMARY.md** - Tool test summary
- **TEST_RESULTS_COMPREHENSIVE.md** - Comprehensive test results
- **APM_TOOLS_FIXES.md** - APM tools fixes and improvements

---

## 🧪 Testing Organization

### Test Files

- `test-all-mcp-tools.js` - Comprehensive MCP tool tests
- `test-mcp-integration.js` - MCP integration tests
- `test-apm-tools.js` - APM-specific tool tests
- `test-error-scenarios.js` - Error handling tests
- `test-*.sh` - Shell-based integration tests

### Test Helpers

Located in `tests/helpers/`:

- Mock data generators
- Test utilities
- Common assertions

---

## 🔒 Security & Gitignore

### Files Always Excluded from Git

**Sensitive Data**:

- `.env*` - Environment variable files
- `*credential*`, `*secret*`, `*token*`, `*_key*` - Credential patterns
- `.claude/settings.local.json` - Local settings (may contain API keys)
- `.mcp.json` - Project MCP config (may contain paths)
- `test-credentials.sh` - Test file with credentials

**Session/Temporary**:

- `SESSION_SUMMARY.md` - Working session notes
- `CLAUDE-FULL.md` - Extended documentation
- `OBSERVABILITY_ISSUES.md` - Working notes (may contain examples with keys)
- `temp_working/` - Temporary working directory

**Build Artifacts**:

- `build/` - Compiled JavaScript
- `node_modules/` - Dependencies
- `*.log` - Log files

**Reports**:

- `reports/datadog-assessment-*/` - Customer assessment reports
- `reports/DELIVERABLES-COMPLETE.md` - Deliverables

**Backups**:

- `*.backup.*`, `*.bak` - Backup files (may contain old credentials)

---

## 📦 Distribution Files

### NPM Package Includes

- `build/` - Compiled JavaScript
- `package.json` - Package metadata
- `README.md` - Documentation
- `LICENSE` - License file

### Excluded from NPM

- Source TypeScript files (src/)
- Test files (tests/)
- Documentation (docs/)
- Examples (examples/)
- Configuration files not needed at runtime

---

## 🚀 Scripts Available

### Setup Scripts (scripts/)

- `quickstart-setup.sh` - All-in-one setup
- `setup-datadog-env.sh` - Datadog credentials
- `setup-claude-mcp.sh` - Global MCP config
- `setup-project-mcp.sh` - Project MCP config
- `setup-claude-desktop.sh` - Claude Desktop config
- `setup-gemini-cli.sh` - Gemini CLI config
- `setup-cursor.sh` - Cursor IDE config
- `setup-continue.sh` - Continue.dev config

### Test Scripts

- `pnpm test` - Run all tests
- `pnpm build` - Build the project
- `pnpm lint` - Lint the code

---

## 🎯 Skills (.claude/skills/)

Custom Claude Code skills:

1. **datadog-healthcheck** - 100-point account health assessment
2. **datadog-sli-slo-analysis** - SLI/SLO recommendations from APM
3. **datadog-tagging-strategy** - Tag compliance audit
4. **datadog-usage-attribution** - Cost analysis and optimization

---

## 🔄 Workflow

### Development Workflow

1. Edit TypeScript source in `src/`
2. Run `pnpm build` to compile
3. Run `pnpm test` to validate
4. Use `scripts/` for local testing
5. Commit changes (respecting .gitignore)

### User Workflow

1. Clone repository
2. Run `scripts/quickstart-setup.sh` (or manual setup from docs/)
3. Use MCP server with Claude Code or other MCP clients
4. Refer to `docs/` for guides

### Testing Workflow

1. Set up credentials with `scripts/setup-datadog-env.sh`
2. Build with `pnpm build`
3. Run tests with `pnpm test`
4. Check `tests/` for specific test scripts

---

## 📖 Documentation Index

See [docs/DOCUMENTATION-INDEX.md](docs/DOCUMENTATION-INDEX.md) for a complete index of all documentation files.

---

## 🔗 Related Files

- [README.md](README.md) - Main project README
- [SECURITY.md](SECURITY.md) - Security policy
- [docs/QUICKSTART.md](docs/QUICKSTART.md) - Quick start guide
- [docs/MCP_CONFIGURATION.md](docs/MCP_CONFIGURATION.md) - MCP configuration guide
- [.gitignore](.gitignore) - Git ignore patterns

---

**For the latest structure, run**: `tree -L 2 -I 'node_modules|build'`
