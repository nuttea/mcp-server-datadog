# Datadog MCP Server - Quick Reference

> **📌 Note**: This is the **quick reference** guide for Claude Code. For comprehensive context and detailed patterns, see [CLAUDE-FULL.md](CLAUDE-FULL.md).

**32 Tools** | **4 Skills** | **12 Modules** | **Production Ready**

---

## Stack

Node 20+, TypeScript ESM, Zod 4, MCP SDK 1.25, pnpm

## Architecture

3-file pattern: `schema.ts` (Zod) + `tool.ts` (handlers) + `index.ts` (exports)

## Key Features

- **Validation**: Lenient mode, logs warnings, auto-fills time ranges
- **Retry**: 2 attempts, exponential backoff, 429/5xx/network errors
- **Logging**: stderr only (stdout = MCP protocol)

## Modules & Tools (32)

1. **incidents** (1) - consolidated list/get
2. **logs** (2) - get_logs, get_all_services
3. **metrics** (1) - query_metrics
4. **monitors** (1) - get_monitors
5. **dashboards** (2) - list/get
6. **traces** (1) - list_traces
7. **hosts** (4) - list, count, mute, unmute
8. **downtimes** (3) - list, schedule, cancel
9. **rum** (5) - apps, events, grouped, performance, waterfall
10. **slo** (3) - list, get, history
11. **apm** (4) - stats realtime/agg, endpoints, ops
12. **notebooks** (5) - create, list, get, update, delete ⭐ NEW!

## Claude Skills (.claude/skills/)

1. **datadog-healthcheck** - Account health (100-pt score)
2. **datadog-sli-slo-analysis** - SLI/SLO from APM
3. **datadog-tagging-strategy** - Tag compliance
4. **datadog-usage-attribution** - Cost analysis

**Agent Guide**: CLAUDE-DATADOG.md (proactive SRE advisory)

## Add Tool Pattern

```typescript
// 1. Schema
export const MySchema = z.object({ id: z.string().max(100) })

// 2. Tool
export const createHandlers = (api) => ({
  my_tool: async (req) => {
    const params = parseWithWarnings(MySchema, req.params.arguments, 'my_tool')
    const res = await withRetry(() => api.getData(params))
    return { content: [{ type: 'text', text: JSON.stringify(res) }] }
  },
})

// 3. Register in src/index.ts
```

## Env Vars

**Required**: DATADOG_API_KEY, DATADOG_APP_KEY
**Optional**: DATADOG_SITE, DATADOG_MAX_RETRIES, DATADOG_RETRY_DELAY_MS

## Scripts (scripts/)

- setup-kiro-datadog-mcp.sh
- run-with-node20.sh
- add-remote-mcp.sh
- add-mcp-server.sh

## Commands

```bash
pnpm install && pnpm build && pnpm test  # 184/185 passing
```

## ⚠️ CRITICAL: Always Test Before Commit

**MANDATORY**: Test with EXPECTED RESULTS before committing!

Workflow:

1. `pnpm build` ✅
2. `pnpm test` ✅
3. **Integration test** - Real API call ✅
4. **VERIFY output** - Matches expectations ✅
5. `pnpm lint` ✅
6. **Then commit**

Red Flags:

- ❌ Returns 0 when data exists
- ❌ "No errors" without checking output
- ❌ Skip integration testing
- ❌ Assume working = no errors

**Rule**: Verify results, not just errors!

## Status

✅ Production-ready | ✅ 184/185 tests | ✅ Enterprise-grade

**Full docs**: See README.md, SECURITY.md, docs/HEALTHCHECK_GUIDE.md

---

**Minimal context loaded. Reference detailed files as needed.** ✨
