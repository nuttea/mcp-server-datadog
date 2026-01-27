# Service Discovery Diagnostic

## Issue

User sees 29 services in Datadog UI but `get_all_services` only returns 11-24 services.

**Missing Services:**

- `smartids_cpf_uat` (env:uat)
- `mysmartsales_cpf_uat` (env:uat)

## Root Cause Analysis

### 1. `get_all_services` Implementation

**Current Behavior:**

- Queries **Service Catalog** (pageSize: 100) → Returns ~10 services
- Queries **Logs** (last 7 days, limit: 1000) → Returns services from logs
- **Does NOT query APM/Traces**

**UI Behavior:**

- Shows **APM Services Page**
- Queries **APM telemetry data** (traces/spans)
- Timeframe: **Past 1 Week**
- Shows 29 services with APM instrumentation

### 2. Why Services Are Missing

| Service              | In Catalog? | In Logs? | In APM?        | Reason                             |
| -------------------- | ----------- | -------- | -------------- | ---------------------------------- |
| smartids_cpf_uat     | ❌          | ❓       | ✅ (confirmed) | No catalog entry, may have no logs |
| mysmartsales_cpf_uat | ❌          | ❓       | ✅ (confirmed) | No catalog entry, may have no logs |

**Key Insight:** These services send **APM traces** but may not:

- Be registered in Service Catalog
- Generate logs frequently enough

### 3. Solution: Add APM-Based Service Discovery

The UI discovers services by querying APM metrics:

```
GET /api/v1/query?query=trace.*.hits{*} by {service}
```

This returns ALL services that have sent APM data in the timeframe.

## Recommended Fix

### Option 1: Enhance `get_all_services` to Query APM

```typescript
// Add APM service discovery
const servicesFromAPM = new Set<string>()
try {
  const apmResponse = await metricsApi.queryMetrics({
    from: from,
    to: to,
    query: 'sum:trace.*.hits{*} by {service}.as_count()',
  })

  if (apmResponse.series) {
    for (const series of apmResponse.series) {
      const serviceMatch = series.scope?.match(/service:([^,}]+)/)
      if (serviceMatch) {
        servicesFromAPM.add(serviceMatch[1])
      }
    }
  }
} catch {
  // APM not available
}

// Combine: Catalog + Logs + APM
const allServices = new Set([
  ...servicesFromCatalog,
  ...servicesFromLogs,
  ...servicesFromAPM, // ← New!
])
```

### Option 2: Create New Tool `get_all_apm_services`

Create dedicated tool that only queries APM:

```typescript
get_all_apm_services({
  timeframe: '7d', // Match UI default
  env: 'uat', // Optional environment filter
})
```

## Immediate Workaround

User can query specific services directly:

```javascript
// Check if service has APM data
await get_service_stats_realtime({
  service: 'smartids_cpf_uat',
  from: 'now-7d',
  to: 'now',
  env: 'uat',
})

// Check if service has logs
await get_logs({
  query: 'service:smartids_cpf_uat',
  from: 'now-7d',
  to: 'now',
})
```

## Test Commands

```bash
# Test with longer timeframe
get_all_services({ timeframe: '7d' })

# Test with environment filter
get_logs({ query: 'env:uat', from: 'now-7d', to: 'now' })

# Search for specific service
list_traces({ query: 'service:smartids_cpf_uat', from: 'now-7d', to: 'now', limit: 1 })
```

## Verification Needed

1. ✅ Service exists in APM (seen in traces)
2. ❓ Service exists in logs? (need to check)
3. ❌ Service in Service Catalog? (not in first 100 results)

## Next Steps

1. Implement Option 1 (enhance get_all_services with APM discovery)
2. Test with both services
3. Update documentation
