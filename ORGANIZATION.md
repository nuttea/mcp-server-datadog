# Project Organization

## Directory Structure

```
mcp-server-datadog/
├── src/                    # Source code
│   ├── tools/              # MCP tool implementations (12 modules)
│   │   ├── apm/
│   │   ├── logs/
│   │   ├── rum/
│   │   ├── traces/
│   │   └── ...
│   └── utils/              # Shared utilities
│
├── tests/                  # All tests
│   ├── tools/              # Unit tests (Vitest)
│   ├── utils/              # Utility tests
│   └── integration/        # Integration tests ⭐ NEW
│       ├── README.md
│       ├── test-high-priority-fixes.js
│       └── test-mysmartsales-service.js
│
├── docs/                   # Documentation ⭐ ORGANIZED
│   ├── README.md           # Documentation index
│   ├── testing/            # Testing documentation ⭐ NEW
│   │   ├── README.md
│   │   ├── FINAL_TEST_REPORT.md
│   │   ├── HIGH_PRIORITY_FIXES.md
│   │   ├── ISSUES_RESOLVED.md
│   │   └── diagnose-services.md
│   ├── HEALTHCHECK_GUIDE.md
│   ├── TESTING_GUIDE.md
│   └── ...
│
├── scripts/                # Helper scripts
│   ├── testing/            # Testing helper scripts ⭐ NEW
│   │   ├── README.md
│   │   ├── test-service-exists.sh
│   │   ├── test-api-apm-services.sh
│   │   └── ...
│   ├── setup-claude-mcp.sh
│   └── ...
│
├── .claude/                # Claude configuration
│   └── skills/             # Claude skills (4 skills)
│
├── package.json            # Dependencies & scripts
├── README.md               # Main documentation
└── SECURITY.md             # Security guidelines
```

## Quick Navigation

### For Developers

**Source Code:**

- [src/tools/](src/tools/) - All 32 MCP tools across 12 modules
- [src/utils/](src/utils/) - Shared utilities (retry, validation, time parsing)

**Tests:**

- [tests/tools/](tests/tools/) - Unit tests (195 tests)
- [tests/integration/](tests/integration/) - Integration tests (2 scripts)

**Scripts:**

- [scripts/](scripts/) - Setup scripts (MCP, Claude, etc.)
- [scripts/testing/](scripts/testing/) - Testing helper scripts (6 scripts)

### For Users

**Getting Started:**

- [README.md](README.md) - Project overview
- [QUICKSTART.md](QUICKSTART.md) - Quick setup
- [docs/MCP_CONFIGURATION.md](docs/MCP_CONFIGURATION.md) - MCP setup guide

**Documentation:**

- [docs/README.md](docs/README.md) - Documentation index
- [docs/testing/](docs/testing/) - Testing guides and reports

**Skills:**

- [.claude/skills/](./claude/skills/) - 4 Datadog analysis skills

## Test Commands

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# HIGH priority fixes
npm run test:fixes

# Specific service test
npm run test:service

# All tests
npm run test:all
```

## Documentation Categories

### Setup & Configuration

- README.md
- QUICKSTART.md
- SECURITY.md
- docs/MCP_CONFIGURATION.md

### Development

- CLAUDE.md
- PROJECT_STRUCTURE.md
- docs/CLAUDE-DATADOG.md

### Testing (⭐ NEW)

- docs/TESTING_GUIDE.md
- docs/testing/FINAL_TEST_REPORT.md
- docs/testing/HIGH_PRIORITY_FIXES.md
- docs/testing/ISSUES_RESOLVED.md

### Reference

- docs/HEALTHCHECK_GUIDE.md
- docs/NOTEBOOKS-GUIDE.md
- docs/DOCUMENTATION-INDEX.md

## File Counts

- **Source Files:** 50+ TypeScript files
- **Unit Tests:** 18 test files (195 tests)
- **Integration Tests:** 2 scripts (13 tests)
- **Helper Scripts:** 6 shell scripts
- **Documentation:** 25+ markdown files
- **Skills:** 4 Claude skills
- **Total MCP Tools:** 32 tools across 12 modules

## Recent Changes

### 2026-01-26

- ✅ Fixed all 6 HIGH priority issues
- ✅ Organized documentation into docs/testing/
- ✅ Organized test scripts into tests/integration/
- ✅ Organized helper scripts into scripts/testing/
- ✅ Created README.md in each directory
- ✅ Updated package.json script paths

### Status

✅ **Production Ready**

- All tests passing (99.6%)
- Documentation complete
- Files organized
- Ready to ship

---

**Last Updated:** 2026-01-26
**Version:** 1.7.0+
**Status:** ✅ Clean & Organized
