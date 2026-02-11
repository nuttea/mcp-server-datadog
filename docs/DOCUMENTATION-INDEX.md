# Datadog MCP Server - Documentation Index

**Version**: 1.8.0-dev (with Notebooks)
**Last Updated**: 2026-01-03

---

## 📚 Core Documentation

### Getting Started

- **[README.md](../README.md)** - Main documentation, setup, all 32 tools
- **[SECURITY.md](../SECURITY.md)** - Security policy and best practices
- **[CLAUDE.md](../CLAUDE.md)** - Quick reference for Claude Code

### Architecture & Development

- **[PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md)** - Codebase organization
- **[src/tools/notebooks/README.md](../src/tools/notebooks/README.md)** - Notebook tools reference

---

## 🎯 Feature Guides

### Health Checks & Assessment

- **[HEALTHCHECK_GUIDE.md](./HEALTHCHECK_GUIDE.md)** - Comprehensive health check guide
- **[CLAUDE-DATADOG.md](../CLAUDE-DATADOG.md)** - SRE maturity framework & agent instructions

### Notebooks & Reporting

- **[NOTEBOOKS-GUIDE.md](./NOTEBOOKS-GUIDE.md)** - How to use Datadog Notebooks tools
- **[reports/templates/README.md](../reports/templates/README.md)** - Report templates guide

---

## 📊 Report Templates

**Location**: `reports/templates/`

Reusable templates for generating assessment reports:

- Executive Summary Template (30+ variables)
- Health Check Template (50+ variables)
- Tagging Strategy Template (60+ variables)
- SLI/SLO Analysis Template (45+ variables)
- Usage Attribution Template (40+ variables)
- Action Items Template (35+ variables)

**Guide**: [reports/templates/README.md](../reports/templates/README.md)

---

## 🛠️ Tool Categories

### Infrastructure (4 tools)

- list_hosts, get_active_hosts_count, mute_host, unmute_host

### Monitoring (1 tool)

- get_monitors

### Incidents (2 tools)

- list_incidents, get_incident

### Logs (2 tools)

- get_logs, get_all_services

### Metrics (1 tool)

- query_metrics

### Dashboards (2 tools)

- list_dashboards, get_dashboard

### Traces (1 tool)

- list_traces

### Downtimes (3 tools)

- list_downtimes, schedule_downtime, cancel_downtime

### RUM (5 tools)

- get_rum_applications, get_rum_events, get_rum_grouped_event_count
- get_rum_page_performance, get_rum_page_waterfall

### SLOs (3 tools)

- list_slos, get_slo, get_slo_history

### APM (4 tools)

- get_service_stats_realtime, get_service_stats_aggregated
- get_service_endpoints, get_operation_stats

### **Notebooks (5 tools)** ⭐ NEW!

- create_notebook, list_notebooks, get_notebook
- update_notebook, delete_notebook

**Total**: 32 tools across 12 categories

---

## 🎓 Claude Skills

**Location**: `.claude/skills/`

Professional analysis workflows:

1. **datadog-healthcheck** - Account health (100-pt score)
2. **datadog-tagging-strategy** - Tag compliance audit
3. **datadog-sli-slo-analysis** - SLI/SLO recommendations
4. **datadog-usage-attribution** - Cost analysis & optimization

**Usage**: `/datadog-healthcheck` (or other skill names)

---

## 📖 By Use Case

### Running Health Checks

1. Read [HEALTHCHECK_GUIDE.md](./HEALTHCHECK_GUIDE.md)
2. Run `/datadog-healthcheck` skill
3. Review generated report
4. Follow action items

### Publishing Reports

1. Read [NOTEBOOKS-GUIDE.md](./NOTEBOOKS-GUIDE.md)
2. Use `create_notebook` tool
3. Share URL with team

### Generating Assessments

1. Read [CLAUDE-DATADOG.md](../CLAUDE-DATADOG.md)
2. Run all 4 skills sequentially
3. Use templates from `reports/templates/`
4. Publish to Datadog Notebooks

### Analyzing SLOs

1. Run `/datadog-sli-slo-analysis` skill
2. Review service performance
3. Implement recommended SLOs
4. Track error budgets

### Optimizing Costs

1. Run `/datadog-usage-attribution` skill
2. Implement tagging strategy
3. Enable usage attribution
4. Monitor and optimize

---

## 🔍 Quick Reference

| I want to...      | Read this...                                          | Use this...                  |
| ----------------- | ----------------------------------------------------- | ---------------------------- |
| Set up the server | [README.md](../README.md)                             | Installation section         |
| Run health check  | [HEALTHCHECK_GUIDE.md](./HEALTHCHECK_GUIDE.md)        | `/datadog-healthcheck`       |
| Create notebook   | [NOTEBOOKS-GUIDE.md](./NOTEBOOKS-GUIDE.md)            | `create_notebook`            |
| Analyze tags      | [CLAUDE-DATADOG.md](../CLAUDE-DATADOG.md)             | `/datadog-tagging-strategy`  |
| Define SLOs       | SLI/SLO guide                                         | `/datadog-sli-slo-analysis`  |
| Reduce costs      | Usage attribution guide                               | `/datadog-usage-attribution` |
| Generate reports  | [templates/README.md](../reports/templates/README.md) | Templates + skills           |
| Add new tools     | [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md)       | 3-file pattern               |

---

## 📦 File Organization

```
datadog-mcp-server/
├── README.md                    # Main documentation
├── SECURITY.md                  # Security policy
├── CLAUDE.md                    # Quick reference
├── CLAUDE-DATADOG.md           # SRE advisor instructions
│
├── docs/                        # Documentation
│   ├── DOCUMENTATION-INDEX.md   # This file
│   ├── HEALTHCHECK_GUIDE.md     # Health check guide
│   └── NOTEBOOKS-GUIDE.md       # Notebooks how-to
│
├── reports/
│   └── templates/               # Reusable templates (tracked)
│       ├── README.md
│       ├── 00-EXECUTIVE-SUMMARY-TEMPLATE.md
│       ├── 01-HEALTH-CHECK-TEMPLATE.md
│       ├── 02-TAGGING-STRATEGY-TEMPLATE.md
│       ├── 03-SLI-SLO-TEMPLATE.md
│       ├── 04-USAGE-ATTRIBUTION-TEMPLATE.md
│       └── 07-ACTION-ITEMS-TEMPLATE.md
│
├── src/tools/                   # MCP tool implementations
│   ├── notebooks/              # ⭐ NEW!
│   ├── apm/
│   ├── slo/
│   └── [... 10 more modules]
│
└── .claude/skills/             # Claude Skills
    ├── datadog-healthcheck/
    ├── datadog-tagging-strategy/
    ├── datadog-sli-slo-analysis/
    └── datadog-usage-attribution/
```

---

## 🚀 Getting Help

### For Setup Issues:

- Read [README.md](../README.md) Installation section
- Check DATADOG_API_KEY and DATADOG_APP_KEY are set
- Verify API key has required scopes

### For Tool Usage:

- Check tool descriptions in [README.md](../README.md)
- Read tool-specific READMEs in `src/tools/*/README.md`
- Ask Claude: "How do I use the [tool name] tool?"

### For Assessments:

- Read [CLAUDE-DATADOG.md](../CLAUDE-DATADOG.md)
- Run skills: `/datadog-healthcheck` (or others)
- Use templates: `reports/templates/`

### For Notebooks:

- Read [NOTEBOOKS-GUIDE.md](./NOTEBOOKS-GUIDE.md)
- Check [src/tools/notebooks/README.md](../src/tools/notebooks/README.md)
- Ask Claude: "How do I publish to Datadog Notebooks?"

---

## 📝 Contributing

When adding new features:

1. Follow 3-file pattern (schema, tool, index)
2. Add comprehensive tests
3. Update this documentation index
4. Update main README.md
5. Create guide in `docs/` if needed

---

## 📞 Support

- **Issues**: https://github.com/winor30/mcp-server-datadog/issues
- **Questions**: Ask Claude Code
- **Feature Requests**: GitHub issues

---

**Last Updated**: 2026-01-03
**Version**: 1.8.0-dev (added Notebooks)
