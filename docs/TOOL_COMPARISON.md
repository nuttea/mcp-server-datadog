# Tool Comparison: Official datadog-mcp vs Our Implementation

## Date: 2026-01-27

---

## Official Datadog MCP Tools (Cloud-based, API-based)

Based on available documentation and tool signatures, the official datadog-mcp provides:

### Search/Query Tools (7 tools)

1. **search_datadog_docs** - Search Datadog documentation
2. **search_datadog_logs** - Search logs with SQL analytics
3. **search_datadog_spans** - Search APM spans/traces
4. **search_datadog_metrics** - Search/list available metrics
5. **search_datadog_services** - Search service catalog
6. **search_datadog_dashboards** - Search dashboards
7. **search_datadog_monitors** - Search monitors

### Data Retrieval Tools (3 tools)

8. **get_datadog_metric** - Get metric timeseries data
9. **get_datadog_metric_context** - Get metric metadata and tags
10. **get_datadog_trace** - Get specific trace by ID

### Analysis Tools (5 tools)

11. **analyze_datadog_logs** - SQL-based log analysis
12. **get_datadog_incident** - Get incident details
13. **search_datadog_incidents** - Search incidents
14. **search_datadog_rum_events** - Search RUM events
15. **search_datadog_events** - Search Datadog events

### Notebook Tools (2 tools)

16. **create_datadog_notebook** - Create notebook with widgets
17. **edit_datadog_notebook** - Edit/append to notebook

### Advanced Tools (~4 tools)

18. **search_datadog_hosts** - SQL-based host inventory
19. **search_datadog_service_dependencies** - Service dependency graph
20. **get_datadog_notebook** - Get notebook details
21. Plus potentially more...

---

## Our Implementation (Local MCP Server, SDK-based)

### Our 32 Tools Across 12 Modules

#### Incidents (1)

- incidents

#### Logs (2)

- get_logs
- get_all_services

#### Metrics (1)

- query_metrics

#### Monitors (1)

- get_monitors

#### Dashboards (2)

- list_dashboards
- get_dashboard

#### Traces (1)

- list_traces

#### Hosts (4)

- list_hosts
- get_active_hosts_count
- mute_host
- unmute_host

#### Downtimes (3)

- list_downtimes
- schedule_downtime
- cancel_downtime

#### RUM (5)

- get_rum_applications
- get_rum_events
- get_rum_grouped_event_count
- get_rum_page_performance
- get_rum_page_waterfall

#### SLO (3)

- list_slos
- get_slo
- get_slo_history

#### APM (5)

- list_service_definitions
- get_service_stats_realtime
- get_service_stats_aggregated
- get_service_endpoints
- get_operation_stats

#### Notebooks (5)

- create_notebook
- list_notebooks
- get_notebook
- update_notebook
- delete_notebook

---

## Key Differences

### Official datadog-mcp Strengths

1. **SQL-Based Analytics**

   - `analyze_datadog_logs` - Full SQL queries
   - `search_datadog_hosts` - SQL on host inventory
   - More powerful for complex queries

2. **Search-First Approach**

   - Everything is "search*\*" or "analyze*\*"
   - Optimized for Claude's exploration workflows
   - Built for LLM usage patterns

3. **Documentation Integration**

   - `search_datadog_docs` - Built-in docs search
   - Helps users learn Datadog while using tools

4. **Service Dependencies**
   - `search_datadog_service_dependencies` - Unique feature
   - Maps upstream/downstream relationships

### Our Implementation Strengths

1. **CRUD Operations**

   - Full notebook CRUD (create, update, delete)
   - Downtime management (schedule, cancel)
   - Host management (mute, unmute)
   - More operational control

2. **Specialized Tools**

   - `get_service_endpoints` - HTTP endpoint discovery
   - `get_operation_stats` - Per-endpoint stats
   - `get_rum_page_waterfall` - Detailed RUM analysis
   - `get_rum_page_performance` - Performance metrics
   - More granular APM tools

3. **Real-Time Stats**

   - `get_service_stats_realtime` - Live APM aggregations
   - `get_service_stats_aggregated` - Pre-aggregated metrics
   - Faster for monitoring use cases

4. **Complete Coverage**
   - SLO history tracking
   - Active host counts
   - Downtime scheduling
   - More operational tools

---

## Recommended Improvements for Our Tools

### 1. Add SQL Analytics (Like Official)

**New Tool: analyze_logs_sql**

```typescript
{
  sql_query: z.string().describe('SQL query against logs table'),
  from: z.union([z.number(), z.string()]),
  to: z.union([z.number(), z.string()]),
  extra_columns: z.array(z.object({
    name: z.string(),
    type: z.enum(['string', 'int64', 'float64', 'bool'])
  })).optional()
}
```

### 2. Improve Metric Discovery

**Enhance: query_metrics**

```typescript
// Add metric search/discovery
{
  query: z.string().describe('Metric query or search pattern'),
  search_mode: z.boolean().optional().describe('If true, search for metrics matching pattern'),
  include_tags: z.boolean().optional().describe('Include available tags for metric')
}
```

### 3. Add Service Dependencies

**New Tool: get_service_dependencies**

```typescript
{
  service: z.string().describe('Service name'),
  direction: z.enum(['upstream', 'downstream']).describe('Dependency direction'),
  from: z.union([z.number(), z.string()]),
  to: z.union([z.number(), z.string()])
}
```

### 4. Enhance APM Tools with More Aggregations

**Improve: get_service_stats_realtime**

Add support for:

- Custom percentiles (p50, p90, p99, p99.9)
- More aggregation functions
- Resource-level breakdowns

```typescript
{
  service: z.string(),
  from: z.union([z.number(), z.string()]),
  to: z.union([z.number(), z.string()]),
  env: z.string().optional(),
  percentiles: z.array(z.number()).optional().default([75, 95, 99])
    .describe('Latency percentiles to calculate (default: [75, 95, 99])'),
  group_by: z.enum(['resource', 'env', 'version']).optional()
    .describe('Dimension to group results by')
}
```

### 5. Better Metric Context

**New Tool: get_metric_context** (inspired by official)

```typescript
{
  metric_name: z.string().describe('Metric name (e.g., system.cpu.user)'),
  include_related_assets: z.boolean().optional()
    .describe('Include dashboards/monitors using this metric'),
  include_tag_values: z.boolean().optional()
    .describe('Include all tag values (not just keys)')
}
```

---

## Comparison Matrix

| Feature                    | Official datadog-mcp | Our Implementation             | Winner   |
| -------------------------- | -------------------- | ------------------------------ | -------- |
| **SQL Analytics**          | ✅ Yes (logs, hosts) | ❌ No                          | Official |
| **Search Docs**            | ✅ Built-in          | ❌ No                          | Official |
| **Service Dependencies**   | ✅ Yes               | ❌ No                          | Official |
| **CRUD Operations**        | ⚠️ Limited           | ✅ Full (notebooks, downtimes) | Ours     |
| **Endpoint Discovery**     | ❌ No                | ✅ Yes (with categorization)   | Ours     |
| **RUM Waterfall**          | ❌ No                | ✅ Yes                         | Ours     |
| **Host Management**        | ❌ No                | ✅ Yes (mute/unmute)           | Ours     |
| **SLO History**            | ⚠️ Limited           | ✅ Full                        | Ours     |
| **Real-time Aggregations** | ⚠️ Basic             | ✅ Advanced                    | Ours     |
| **Metric Context**         | ✅ Rich              | ⚠️ Basic                       | Official |

---

## Our Unique Tools (Not in Official)

### Operational Tools

1. **mute_host / unmute_host** - Alert management
2. **schedule_downtime / cancel_downtime** - Downtime management
3. **update_notebook / delete_notebook** - Full notebook lifecycle

### APM-Specific

4. **get_service_endpoints** - HTTP endpoint discovery with categorization
5. **get_operation_stats** - Per-endpoint performance
6. **get_service_stats_aggregated** - Pre-aggregated metrics

### RUM-Specific

7. **get_rum_page_waterfall** - Detailed session waterfall
8. **get_rum_page_performance** - Page performance metrics
9. **get_rum_grouped_event_count** - Event grouping/counting

### Infrastructure

10. **get_active_hosts_count** - Quick host count
11. **list_downtimes** - View scheduled maintenance

---

## Official Unique Tools (Not in Ours)

### Analytics & Search

1. **analyze_datadog_logs** - SQL on logs (powerful!)
2. **search_datadog_hosts** - SQL on host inventory
3. **search_datadog_docs** - Built-in documentation search
4. **search_datadog_service_dependencies** - Dependency mapping

### Enhanced Metadata

5. **get_datadog_metric_context** - Rich metric metadata with related assets
6. **search_datadog_events** - General event search
7. **search_datadog_incidents** - Advanced incident search

---

## Action Items for Improvement

### High Priority (Add Missing Critical Features)

1. ✅ **Add SQL log analytics** - Most requested feature

   ```bash
   New tool: analyze_logs_sql
   ```

2. ✅ **Add service dependencies** - Important for debugging

   ```bash
   New tool: get_service_dependencies
   ```

3. ✅ **Enhance metric tools** - Add context and search
   ```bash
   Improve: query_metrics
   Add: get_metric_context
   ```

### Medium Priority (Improve Existing)

4. **Better default parameters** - Match official patterns
5. **Richer descriptions** - Include examples and links
6. **Better error messages** - Guide users to docs

### Low Priority (Nice to Have)

7. **Documentation search** - Integrate with Datadog docs
8. **Event search** - General event queries
9. **Advanced incident search** - More filtering options

---

## Current Tools That Need Schema Improvements

### APM Tools

#### get_service_stats_realtime

**Current:**

```typescript
{
  service: z.string(),
  from: z.union([z.number(), z.string()]),
  to: z.union([z.number(), z.string()]),
  env: z.string().optional()
}
```

**Recommended:**

```typescript
{
  service: z.string()
    .describe('Service name. Use get_all_services to discover available services'),
  from: z.union([z.number(), z.string()])
    .describe('Start time. Examples: "now-7d", 1769400000, or ISO-8601'),
  to: z.union([z.number(), z.string()])
    .describe('End time. Examples: "now", 1769500000, or ISO-8601'),
  env: z.string().optional()
    .describe('Filter by environment tag (e.g., "prod", "dev", "uat")'),
  operation_name: z.string().optional()
    .describe('Filter by operation name (e.g., "express.request", "servlet.request")')
}
```

#### get_service_endpoints

**Current:**

```typescript
{
  service: z.string(),
  from: z.number(),
  to: z.number(),
  env: z.string().optional(),
  limit: z.number().default(100)
}
```

**Recommended:**

```typescript
{
  service: z.string()
    .describe('Service name to discover endpoints for'),
  from: z.union([z.number(), z.string()])
    .describe('Start time (default: 7 days ago)'),
  to: z.union([z.number(), z.string()])
    .describe('End time (default: now)'),
  env: z.string().optional()
    .describe('Filter by environment'),
  limit: z.number().default(100).max(1000)
    .describe('Max endpoints to return (default: 100, max: 1000)'),
  operation_type: z.enum(['web', 'all']).optional().default('web')
    .describe('Type of operations to discover (default: web for HTTP endpoints)')
}
```

### Metrics Tools

#### query_metrics

**Current:**

```typescript
{
  query: z.string(),
  from: z.number(),
  to: z.number()
}
```

**Recommended:**

```typescript
{
  query: z.string()
    .describe('Metric query in format: aggregation:metric.name{filter}. Examples: "avg:system.cpu.user{*}", "sum:trace.*.hits{service:my-service} by {env}". See: https://docs.datadoghq.com/dashboards/querying/'),
  from: z.union([z.number(), z.string()])
    .describe('Start time. Supports: Unix timestamps, ISO-8601, or relative ("now-7d")'),
  to: z.union([z.number(), z.string()])
    .describe('End time. Supports: Unix timestamps, ISO-8601, or relative ("now")'),
  formula: z.array(z.string()).optional()
    .describe('Optional formulas to apply (e.g., ["query0 * 100", "anomalies(query0, basic, 2)"])'),
  interval: z.number().optional()
    .describe('Time interval in seconds for data points')
}
```

---

## Implementation Recommendations

### Phase 1: Schema Improvements (Immediate)

Update all tool descriptions to include:

- ✅ Better parameter descriptions with examples
- ✅ Links to Datadog documentation
- ✅ Default values explicitly stated
- ✅ Common use case examples

### Phase 2: Add Missing Features (Short-term)

1. **Add operation_type filter** to get_service_endpoints
2. **Add percentiles parameter** to get_service_stats_realtime
3. **Add formulas support** to query_metrics
4. **Add metric_context tool** for metadata

### Phase 3: New Advanced Tools (Long-term)

1. **analyze_logs_sql** - SQL analytics on logs
2. **get_service_dependencies** - Upstream/downstream services
3. **search_metrics** - Metric discovery
4. **get_metric_tags** - Available tags for metric

---

## Next Steps

1. ✅ Review official datadog-mcp tool schemas
2. ✅ Identify schema improvements needed
3. 🔄 Implement schema enhancements for APM tools
4. 🔄 Implement schema enhancements for Metrics tools
5. 🔄 Add new advanced tools (SQL analytics, dependencies)
6. 🔄 Update documentation with examples
7. ✅ Test all improvements

---

**Current Status:** Analysis complete, ready to implement improvements
