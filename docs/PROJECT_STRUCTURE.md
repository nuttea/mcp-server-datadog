# Project Structure

## Directory Organization

```
mcp-server-datadog/
├── .claude/
│   └── skills/              # Claude Skills (4 professional workflows)
│       ├── datadog-healthcheck/
│       ├── datadog-sli-slo-analysis/
│       ├── datadog-tagging-strategy/
│       └── datadog-usage-attribution/
├── .github/
│   └── workflows/           # CI/CD pipelines
│       ├── ci.yml
│       └── publish.yml
├── src/
│   ├── index.ts            # Main server entry point
│   ├── tools/              # 11 tool modules, 27 tools
│   │   ├── incident/       # Incidents (consolidated)
│   │   ├── logs/           # Log search & service extraction
│   │   ├── metrics/        # Metrics queries
│   │   ├── monitors/       # Monitor status
│   │   ├── dashboards/     # Dashboard management
│   │   ├── traces/         # APM traces
│   │   ├── hosts/          # Host management
│   │   ├── downtimes/      # Downtime scheduling
│   │   ├── rum/            # Real User Monitoring
│   │   ├── slo/            # NEW: Service Level Objectives
│   │   └── apm/            # NEW: APM Statistics & Analysis
│   └── utils/              # Shared utilities
│       ├── types.ts
│       ├── datadog.ts
│       ├── helper.ts
│       ├── tool.ts
│       ├── validation.ts   # NEW: Lenient validation
│       └── retry.ts        # NEW: Retry with backoff
├── tests/
│   ├── tools/              # Tool tests (15 files, 151 passing)
│   ├── utils/              # Utility tests
│   └── helpers/            # Test helpers & mocks
├── scripts/                # Automation scripts
│   ├── README.md
│   ├── setup-kiro-datadog-mcp.sh
│   ├── run-with-node20.sh
│   ├── add-remote-mcp.sh
│   ├── add-mcp-server.sh
│   └── test-datadog-auth.sh
├── docs/                   # Documentation
│   └── HEALTHCHECK_GUIDE.md
├── notebooks/              # Datadog notebooks (examples)
├── build/                  # Compiled output (gitignored)
├── node_modules/           # Dependencies (gitignored)
├── CLAUDE.md               # AI assistant context guide
├── README.md               # This file
├── SECURITY.md             # Security policy
├── package.json
├── tsconfig.json
└── .env                    # Environment variables (gitignored)
```

## Key Files

### Configuration

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `tsup.config.ts` - Build configuration
- `.env` - Environment variables (not in git)

### Core Code

- `src/index.ts` - MCP server initialization
- `src/tools/*/` - 11 tool modules
- `src/utils/` - Shared utilities

### Documentation

- `README.md` - Complete tool reference
- `CLAUDE.md` - AI context and patterns
- `SECURITY.md` - Security policy
- `docs/HEALTHCHECK_GUIDE.md` - Health check guide

### Claude Skills

- `.claude/skills/*/SKILL.md` - 4 professional workflows

### Scripts

- `scripts/*.sh` - 7 automation scripts
