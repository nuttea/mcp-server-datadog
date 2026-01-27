# Tool Improvements Based on Comprehensive Testing

## Date: 2026-01-27

## Test Results: 7 Passed, 4 Failed (404), 13 Empty/No Data, 9 Skipped

---

## Summary of Tool Status

### ✅ Working Tools (7/24 tested = 29%)

| Tool                        | Category   | Status | Notes                       |
| --------------------------- | ---------- | ------ | --------------------------- |
| get_all_services            | Logs       | ✅     | Returns 32 services         |
| list_dashboards             | Dashboards | ✅     | Returns 5 dashboards        |
| get_active_hosts_count      | Hosts      | ✅     | Returns active count        |
| get_rum_grouped_event_count | RUM        | ✅     | Groups RUM events           |
| get_rum_page_performance    | RUM        | ✅     | Returns performance metrics |
| get_service_stats_realtime  | APM        | ✅     | Returns APM stats           |
| get_service_endpoints       | APM        | ✅     | Discovers endpoints         |

### ❌ Tools with 404 Errors (4/24 = Need ID Updates)

| Tool            | Issue            | Fix                                   |
| --------------- | ---------------- | ------------------------------------- |
| get_dashboard   | Wrong ID in test | Use: 7fu-ykf-yrq                      |
| get_slo         | Wrong ID in test | Use: 42bb017359175aa3af9a24eeebc317d0 |
| get_slo_history | Wrong ID in test | Use: 42bb017359175aa3af9a24eeebc317d0 |
| get_notebook    | Wrong ID in test | Use: 13569272                         |

### ⚠️ Tools with Empty/No Data (13/24 = Need Investigation)

Possible reasons:

1. Different Datadog account (switched from sandbox to production)
2. Data doesn't exist in this environment
3. Query parameters need adjustment
4. Tool description doesn't match usage

---

## Recommended Improvements by Tool

### 1. incidents

**Current Description:**
"Get incidents from Datadog - list all or get specific incident by ID"

**Issue:** Returns empty (no active incidents in this account)

**Recommended Improvements:**

```typescript
// Add optional parameters for better filtering
{
  query: z.string().optional().describe('Filter incidents by query'),
  from: z.number().optional().describe('Start time for incident search'),
  to: z.number().optional().describe('End time for incident search'),
  limit: z.number().optional().default(100),
}
```

**Better Description:**
"List active and resolved incidents. Returns empty if no incidents exist. Use query parameter to filter by status, severity, or team."

---

### 2. get_logs

**Current Description:**
"Search and retrieve logs from Datadog"

**Issue:** Returns empty with default service query

**Recommended Improvements:**

- Make query examples more visible
- Add common query patterns in description
- Default to wildcard '\*' if service doesn't have logs

**Better Description:**
"Search and retrieve logs from Datadog. Common queries: 'service:my-service', 'status:error', 'source:nginx'. Default timeframe: last 7 days (auto-filled)."

**Schema Enhancement:**

```typescript
query: z.string()
  .default('*')
  .describe(
    'Log search query. Examples: "service:my-service", "status:error", "*" for all logs. See: https://docs.datadoghq.com/logs/explorer/search_syntax/',
  )
```

---

### 3. query_metrics

**Current Description:**
"Query timeseries points of metrics from Datadog"

**Issue:** Returns empty with system.cpu.user query

**Recommended Improvements:**

- List common available metrics
- Add validation for metric format
- Provide query builder examples

**Better Description:**
"Query timeseries metrics from Datadog. Use format: 'aggregation:metric.name{filter}'. Common metrics: 'system.cpu.user', 'system.load.1', 'trace.\*.hits{service:X}'. Supports wildcards and tag filters."

**Schema Enhancement:**

```typescript
query: z.string()
  .min(3)
  .describe('Metric query in format: aggregation:metric.name{filter}. Examples: "avg:system.cpu.user{*}", "sum:trace.*.hits{service:my-service}". See: https://docs.datadoghq.com/metrics/'),
```

---

### 4. get_monitors

**Current Description:**
"Get monitors status from Datadog"

**Issue:** Returns empty (account has no monitors configured)

**Recommended Improvements:**

- Add optional status filter
- Add tag filtering
- Improve description to mention it can be empty

**Better Description:**
"List all monitors in Datadog. Returns empty if no monitors configured. Optional filters: tags, monitor_tags, name. Useful for checking alerting setup."

**Schema Enhancement:**

```typescript
{
  tags: z.array(z.string()).optional().describe('Filter by tags (e.g., ["env:prod", "service:api"])'),
  monitor_tags: z.array(z.string()).optional().describe('Filter by monitor tags'),
  name: z.string().optional().describe('Search by monitor name'),
  limit: z.number().optional().default(100),
}
```

---

### 5. list_traces

**Current Description:**
"Get APM traces from Datadog"

**Issue:** Returns empty with mysmartsales_cpf_uat service (but service has APM data!)

**Root Cause:** Different time ranges or sampling

**Recommended Improvements:**

- Increase default limit
- Use longer timeframe by default
- Add env parameter to match services

**Better Description:**
"Search APM traces by service, operation, or query. Returns sampled traces (not all). For complete stats, use get_service_stats_realtime. Default: last 7 days, limit 100."

**Schema Enhancement:**

```typescript
{
  query: z.string().describe('Trace search query. Examples: "service:my-service", "service:X env:prod", "status:error", "resource_name:/api/products"'),
  from: z.union([z.number(), z.string()]).optional().describe('Start time (default: 7 days ago)'),
  to: z.union([z.number(), z.string()]).optional().describe('End time (default: now)'),
  limit: z.number().default(100).describe('Max traces to return (default: 100, max: 1000)'),
  env: z.string().optional().describe('Filter by environment (e.g., "prod", "uat")'),
}
```

---

### 6. list_hosts

**Current Description:**
"Get list of hosts from Datadog"

**Issue:** Returns empty (no hosts with default filter)

**Recommended Improvements:**

- Add filter parameter
- Add sort options
- Mention it can be empty if no infrastructure

**Better Description:**
"List infrastructure hosts reporting to Datadog. Returns empty if no agents installed or hosts match filter. Use filter parameter to search by hostname, tags, or status."

---

### 7. get_rum_applications

**Current Description:**
"Get all RUM applications in the organization"

**Issue:** Returns empty (but we know there ARE RUM apps!)

**Root Cause:** Response format issue - tool may be checking for wrong field

**Fix Required:**
Check response parsing in rum/tool.ts

---

### 8. get_rum_events

**Current Description:**
"Search and retrieve RUM events from Datadog"

**Issue:** Returns empty with @type:view query

**Recommended Improvements:**

- Increase default timeframe (7 days not 1 hour)
- Add application.id to query by default if available
- Better examples

**Better Description:**
"Search RUM events (views, actions, errors, resources). Common queries: '@type:view', '@type:action', '@application.id:xxx'. Default: last 7 days. Returns empty if no RUM data."

---

### 9. list_slos

**Current Description:**
"List Service Level Objectives (SLOs) from Datadog"

**Issue:** Returns empty (but we verified 1 SLO exists!)

**Root Cause:** Response parsing issue

**Fix Required:**
Check response format in slo/tool.ts

---

### 10. list_service_definitions

**Current Description:**
"List service definitions from Datadog Service Catalog"

**Issue:** Returns empty

**Root Cause:** Service Catalog is different from APM services

**Recommended Improvements:**

- Clarify this is Service Catalog (not APM services)
- Mention use get_all_services for APM service discovery
- Add note that many services may not have catalog entries

**Better Description:**
"List services registered in Service Catalog with metadata (team, tier, links). Returns only services with catalog entries. For all APM services, use get_all_services instead."

---

### 11. get_service_stats_aggregated

**Current Description:**
"Get aggregated APM service statistics using pre-aggregated metrics (faster)"

**Issue:** Returns empty with note about missing metrics

**Status:** ✅ Already handles this correctly!

**Current Note:** "Pre-aggregated metrics not available for this service. Use get_service_stats_realtime instead."

**No Changes Needed** - Works as designed

---

### 12. list_notebooks

**Current Description:**
"List all Datadog Notebooks with optional filtering"

**Issue:** Returns empty (but 5 notebooks exist!)

**Root Cause:** Response parsing issue

**Fix Required:**
Check response format in notebooks/tool.ts

---

## Priority Actions

### High Priority (Broken Tools - 3)

1. **get_rum_applications** - Should return data but doesn't
2. **list_slos** - Should return 1 SLO but shows empty
3. **list_notebooks** - Should return 5 notebooks but shows empty

### Medium Priority (Better Defaults - 5)

4. **get_logs** - Use wildcard query by default
5. **query_metrics** - Provide better example metrics
6. **list_traces** - Increase default timeframe to 7 days
7. **get_rum_events** - Use 7-day timeframe by default
8. **list_hosts** - Add filter examples

### Low Priority (Documentation - 5)

9. **incidents** - Add note about empty results
10. **get_monitors** - Add filtering examples
11. **list_downtimes** - Add note about empty results
12. **list_service_definitions** - Clarify vs get_all_services
13. **get_service_stats_aggregated** - Already good!

---

## Implementation Plan

### Step 1: Fix High Priority (Broken Response Parsing)

Check these files:

- `src/tools/rum/tool.ts` - get_rum_applications
- `src/tools/slo/tool.ts` - list_slos
- `src/tools/notebooks/tool.ts` - list_notebooks

Look for:

- Incorrect JSON parsing
- Wrong field names
- Missing data checks

### Step 2: Improve Descriptions

Update tool descriptions to:

- Mention when results can be empty
- Provide query examples
- Link to Datadog docs
- Specify default timeframes

### Step 3: Enhance Schemas

Add to parameter descriptions:

- Common query patterns
- Example values
- Links to documentation
- Default behavior explanation

---

## Test Configuration Issues

### Wrong IDs Used in Tests

**Update test-all-32-tools.js with:**

```javascript
// Dashboards
get_dashboard: { dashboardId: '7fu-ykf-yrq' }  // SmartSales Business KPI

// SLOs
get_slo: { slo_id: '42bb017359175aa3af9a24eeebc317d0' }  // supplyplaning_uat
get_slo_history: { slo_id: '42bb017359175aa3af9a24eeebc317d0', from: sevenDaysAgo, to: now }

// Notebooks
get_notebook: { notebook_id: 13569272 }  // RUM - Web
```

---

## Expected Results After Fixes

### Current: 29.2% Success Rate

- ✅ Passed: 7
- ❌ Failed: 4 (404 errors)
- ⚠️ No Data: 13

### Target: 75%+ Success Rate

- ✅ Passed: 18+ (fix parsing + update IDs)
- ❌ Failed: 0
- ⚠️ No Data: 6 (expected - no data in environment)

---

**Next Steps:**

1. Fix response parsing for RUM/SLO/Notebooks tools
2. Update test IDs
3. Improve tool descriptions and schemas
4. Re-test and verify 75%+ pass rate
