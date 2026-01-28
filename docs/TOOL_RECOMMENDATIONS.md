# Tool Recommendations: Simplify & Enhance

## Executive Summary

**Current:** 32 tools
**Recommended:** 34 tools (remove 2, add 4)
**Reason:** Remove redundant, add critical missing features

---

## ❌ Tools to Remove/Deprecate (2 tools)

### 1. list_service_definitions ⚠️ **DEPRECATE**

**Current Status:**

- Returns only Service Catalog entries (10 services)
- Service Catalog is sparse and inconsistently used
- Users confused vs get_all_services

**Better Alternative:**

- **get_all_services** discovers 36 APM services using APM Services API
- Same data as Datadog UI
- More comprehensive

**Migration Path:**

```typescript
// Before (sparse)
await list_service_definitions({ page_size: 100 })
// Returns: 10 services with catalog metadata

// After (comprehensive)
await get_all_services()
// Returns: 36 services discovered from APM

// If you need catalog metadata specifically
await list_service_definitions()
// Add deprecation warning in response
```

**Action:**

- Add deprecation warning to tool description
- Guide users to get_all_services
- Remove in v2.0

---

### 2. get_service_stats_aggregated ⚠️ **CONSIDER MERGING**

**Current Status:**

- Queries pre-aggregated metrics (trace.{service}.request.\*)
- Often returns empty: "Pre-aggregated metrics not available"
- Only works for some services/languages

**Better Approach:**

- **get_service_stats_realtime** always works (uses Spans API)
- More reliable and consistent
- No user confusion

**Migration Path:**

```typescript
// Option A: Merge into realtime (RECOMMENDED)
await get_service_stats_realtime({
  service: 'my-service',
  use_aggregated: true, // Try pre-agg first, fallback to realtime
})

// Option B: Keep but improve description
await get_service_stats_aggregated({
  service: 'my-service',
})
// Response includes: "note: Pre-aggregated metrics may not exist. Use get_service_stats_realtime for guaranteed results"
```

**Action:**

- Option A: Add `use_aggregated` parameter to realtime tool, deprecate aggregated
- Option B: Keep both, improve documentation about when each works

**Recommendation:** **Option A** - Simpler API surface

---

## ➕ Tools to Add (4 tools)

### 1. analyze_logs_sql 🔥 **HIGH PRIORITY**

**Why:** Official's most powerful feature, enables complex analytics

**Use Cases:**

- Count errors by service: `SELECT service, COUNT(*) FROM logs WHERE status='error' GROUP BY service`
- Top 10 slowest requests: `SELECT resource_name, AVG(duration) FROM logs GROUP BY resource_name ORDER BY AVG(duration) DESC LIMIT 10`
- Custom aggregations, joins, complex filters

**Schema:**

```typescript
{
  sql_query: z.string()
    .describe('SQL query against virtual logs table. Columns: timestamp, service, message, status, host, etc.'),
  from: z.union([z.number(), z.string()])
    .describe('Start time for query window'),
  to: z.union([z.number(), z.string()])
    .describe('End time for query window'),
  extra_columns: z.array(z.object({
    name: z.string(),
    type: z.enum(['string', 'int64', 'float64', 'bool', 'timestamp', 'json'])
  })).optional()
    .describe('Additional log attributes to make queryable')
}
```

---

### 2. get_service_dependencies 🔥 **HIGH PRIORITY**

**Why:** Critical for debugging distributed systems, understanding service mesh

**Use Cases:**

- Find what services call my-service (upstream)
- Find what my-service calls (downstream)
- Map service architecture
- Debug cascading failures

**Schema:**

```typescript
{
  service: z.string()
    .describe('Service name to get dependencies for'),
  direction: z.enum(['upstream', 'downstream'])
    .describe('upstream: services that call this service, downstream: services this service calls'),
  env: z.string().optional()
    .describe('Filter by environment'),
  from: z.union([z.number(), z.string()]).optional()
    .describe('Start time for dependency discovery (default: 7 days ago)'),
  to: z.union([z.number(), z.string()]).optional()
    .describe('End time (default: now)')
}
```

---

### 3. get_metric_context 🎯 **MEDIUM PRIORITY**

**Why:** Helps users understand metrics before querying

**Use Cases:**

- "What tags are available for system.cpu.user?"
- "Which dashboards use this metric?"
- "What are valid tag values for env?"

**Schema:**

```typescript
{
  metric_name: z.string()
    .describe('Metric name (e.g., system.cpu.user, trace.servlet.request.hits)'),
  include_related_assets: z.boolean().optional()
    .describe('Include dashboards, monitors, notebooks, SLOs that use this metric'),
  include_tag_values: z.boolean().optional()
    .describe('Include all values for each tag (e.g., env: [prod, dev, uat])'),
  window: z.number().optional()
    .describe('Lookback window in seconds for tag discovery (default: 4 hours)')
}
```

---

### 4. search_metrics 🎯 **MEDIUM PRIORITY**

**Why:** Discover available metrics by pattern matching

**Use Cases:**

- "What CPU metrics are available?" → Search for "cpu"
- "Find all trace metrics" → Search for "trace."
- "What Redis metrics exist?" → Search for "redis"

**Schema:**

```typescript
{
  pattern: z.string()
    .describe('Search pattern (e.g., "cpu", "trace.", "redis"). Supports wildcards'),
  limit: z.number().optional().default(100)
    .describe('Max metrics to return'),
  tag_filter: z.string().optional()
    .describe('Filter metrics by tag (e.g., "service:my-service")')
}
```

---

## Implementation Priority

### Phase 1: Remove Redundancy (v1.8)

1. ⚠️ Deprecate `list_service_definitions`
2. ⚠️ Merge `get_service_stats_aggregated` → add `use_aggregated` param to realtime

**Result:** 30 tools (from 32)

### Phase 2: Add Critical Features (v1.9)

1. ✅ Add `analyze_logs_sql` - SQL analytics
2. ✅ Add `get_service_dependencies` - Dependencies

**Result:** 32 tools

### Phase 3: Add Discovery Features (v2.0)

1. ✅ Add `get_metric_context` - Metric metadata
2. ✅ Add `search_metrics` - Metric discovery

**Result:** 34 tools

---

## Migration Guide for Users

### If You Use list_service_definitions

**Before:**

```javascript
await list_service_definitions({ page_size: 100 })
// Returns: 10 services with catalog metadata
```

**After:**

```javascript
// For ALL services (recommended)
await get_all_services()
// Returns: 36 APM services

// If you specifically need catalog metadata
await list_service_definitions() // Still works, but deprecated
// Add filter or use Service Catalog UI
```

### If You Use get_service_stats_aggregated

**Before:**

```javascript
await get_service_stats_aggregated({ service: 'my-service' })
// Often returns: {note: "Pre-aggregated metrics not available..."}
```

**After (v1.9+):**

```javascript
await get_service_stats_realtime({
  service: 'my-service',
  use_aggregated: true, // Auto-fallback if not available
})
// Always returns data (uses aggregated if available, realtime otherwise)
```

---

## Comparison: Before vs After

### Before (Current - 32 tools)

**Strengths:**

- Comprehensive coverage
- Full CRUD operations
- Detailed APM/RUM tools

**Weaknesses:**

- 2 tools with sparse data
- Missing SQL analytics
- Missing service dependencies
- Missing metric discovery

### After (Proposed - 34 tools)

**Improvements:**

- ✅ Remove redundant tools (list_service_definitions, get_service_stats_aggregated)
- ✅ Add SQL analytics (analyze_logs_sql)
- ✅ Add service dependencies
- ✅ Add metric discovery tools
- ✅ Cleaner API surface
- ✅ Better user experience

**Tool Count:**

- Remove: 2
- Add: 4
- Net: +2 tools, but much higher value

---

## Decision Matrix

| Tool                         | Keep?    | Reason                                 | Confidence |
| ---------------------------- | -------- | -------------------------------------- | ---------- |
| list_service_definitions     | ❌ No    | Sparse data, better alternative exists | HIGH       |
| get_service_stats_aggregated | ⚠️ Merge | Often empty, confusing                 | MEDIUM     |
| All other 30 tools           | ✅ Yes   | Unique value or operational            | HIGH       |

---

## Next Actions

### 1. Document Deprecations

- Add warnings to tool descriptions
- Update documentation
- Create migration guide

### 2. Implement New Tools

- Start with analyze_logs_sql
- Add get_service_dependencies
- Add metric discovery tools

### 3. Test Everything

- Verify deprecation warnings
- Test new tools thoroughly
- Update integration tests

---

**Recommendation:** Proceed with deprecations and new tool additions.

This will make our MCP server **more focused and powerful** while maintaining operational capabilities that the official implementation lacks.

---

**Last Updated:** 2026-01-27
**Next Review:** After v1.9 release
