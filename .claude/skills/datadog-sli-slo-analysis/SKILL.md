---
name: datadog-sli-slo-analysis
description: Analyze services to define SLIs and recommend SLOs using APM performance data. Get request rates, error rates, and latency percentiles (p50, p75, p95, p99) for services and endpoints. Use when user wants to define SLIs, create SLOs, analyze service performance, or identify reliability targets.
---

# Datadog SLI/SLO Analysis

This skill helps define Service Level Indicators (SLIs) and recommend Service Level Objectives (SLOs) based on real APM performance data.

## When to use this skill

- User asks to "define SLIs" or "create SLOs"
- User wants to analyze service performance or reliability
- User mentions "error budget", "availability target", or "latency SLI"
- User needs to identify which services need SLOs
- User wants to check current SLO compliance

## Workflow

### 1. Discover Services

Use `get_all_services` to get list of all services in Datadog.

```
> get_all_services with query: "*", from: <7 days ago>, to: <now>
```

### 2. Analyze Each Service Performance

For each service discovered, call `get_service_stats_realtime`:

```
> get_service_stats_realtime with service: "store-backend", from: <7 days ago>, to: <now>
```

**Extract key SLI candidates**:

- **Availability SLI**: `(total_requests - total_errors) / total_requests * 100`
- **Error Rate SLI**: `error_percentage`
- **Latency SLI**: `p95_latency_ms` or `p99_latency_ms`
- **Throughput SLI**: `requests_per_second`

### 3. Discover API Endpoints

For services needing endpoint-level SLIs, call `get_service_endpoints`:

```
> get_service_endpoints with service: "store-backend", from: <7 days ago>, to: <now>
```

**Identify critical endpoints**:

- High traffic (top 10 by requests)
- High error rate (>1%)
- High latency (p95 >500ms)

### 4. Check Existing SLO Coverage

Call `list_slos` to see current SLOs:

```
> list_slos
```

Compare services with SLOs vs services discovered. Identify gaps.

### 5. Recommend SLOs

For each service WITHOUT an SLO:

**Availability SLO**:

- **Current Performance**: e.g., 99.85% (from error_percentage)
- **Recommended Target**: 99.5% (lower than current for buffer)
- **Rationale**: Based on past 7 days performance

**Latency SLO**:

- **Current P95**: e.g., 456ms
- **Recommended Target**: <500ms
- **Rationale**: Keep P95 under 500ms for good UX

**Example Output**:

```markdown
## SLI/SLO Analysis for store-backend

### Current Performance (7 days)

- Total Requests: 8.6M
- Request Rate: 142.5 req/s
- Error Rate: 0.23% → **Availability: 99.77%** ✅
- Latency:
  - P50: 98ms
  - P75: 187ms
  - P95: 456ms ✅
  - P99: 892ms

### Recommended SLIs

#### 1. Availability SLI

- **Metric**: `(successful_requests / total_requests) * 100`
- **Current**: 99.77%
- **Recommended SLO Target**: 99.5% (30-day window)
- **Error Budget**: 0.5% (allows ~43,000 errors/month)
- **Rationale**: Current performance has buffer; 99.5% is achievable

#### 2. Latency SLI (P95)

- **Metric**: 95th percentile latency
- **Current**: 456ms
- **Recommended SLO Target**: <500ms
- **Rationale**: Keep UX snappy; current performance supports this

#### 3. Latency SLI (P99)

- **Metric**: 99th percentile latency
- **Current**: 892ms
- **Recommended SLO Target**: <1000ms
- **Rationale**: Catch tail latency issues

### High-Risk Endpoints (Need Attention)

1. **POST /api/checkout**

   - Error Rate: 2.1% ⚠️
   - P95 Latency: 1,234ms ⚠️
   - Recommendation: Investigate errors, optimize query

2. **GET /api/inventory**
   - Error Rate: 1.8% ⚠️
   - Recommendation: Add retry logic, check timeouts

### Existing SLO

✅ "Backend Availability" - 99.95% (target: 99.9%)

- Status: Compliant ✅
- Error Budget: 65% remaining ✅

### Next Steps

1. Create latency SLO (<500ms P95)
2. Investigate POST /api/checkout errors
3. Monitor error budget weekly
```

---

### 6. Generate Comprehensive Report

**Output Structure**:

````markdown
# SLI/SLO ANALYSIS REPORT

**Date**: YYYY-MM-DD
**Services Analyzed**: N
**Existing SLOs**: M
**Coverage**: M/N (X%)

---

## Executive Summary

Analyzed N services for SLI definition and SLO readiness.

Current State:

- X services have SLOs (Y% coverage)
- Z services need SLOs
- W services have performance issues

Recommended Actions:

- Create X new SLOs
- Investigate Y high-error services
- Monitor Z services approaching SLO violations

---

## Service-by-Service Analysis

[For each service, include:]

- Current performance metrics
- Recommended SLIs
- Suggested SLO targets
- Critical endpoints
- Issues found

---

## SLO Coverage Gap Analysis

Services WITHOUT SLOs: Z

Priority for SLO Creation:

1. [Service] - [Reason: high traffic / critical / high errors]
2. [Service] - [Reason]

---

## Recommended SLO Definitions

For immediate implementation:

### Service: [name]

```yaml
type: metric
name: '[Service] Availability'
thresholds:
  - target: 99.5
    timeframe: 30d
    warning: 99.7
query:
  numerator: 'sum:trace.[service].request.hits{!error:true}.as_count()'
  denominator: 'sum:trace.[service].request.hits{*}.as_count()'
```
````

---

## Error Budget Health

Services with SLOs:

| Service | SLO          | Current | Target | Budget | Status |
| ------- | ------------ | ------- | ------ | ------ | ------ |
| [name]  | Availability | 99.95%  | 99.9%  | 75%    | ✅     |
| [name]  | Latency      | 345ms   | 500ms  | 90%    | ✅     |

All budgets healthy ✅ / Some budgets low ⚠️

---

## Cost & Performance Trade-offs

Services to monitor:

- [Service]: High traffic + low SLO = expensive errors
- [Service]: Low traffic + high SLO = over-engineered?

---

## Next Review

Recommended: 30 days
Focus areas: [Based on findings]

```

## Advanced Usage

### Compare Services

```

> "Compare SLO-covered services vs uncovered and recommend which to prioritize"

```

### Historical Trends

```

> "Analyze SLO history for past 90 days and identify trends"

```

### Per-Endpoint SLOs

```

> "Should I create SLOs for individual endpoints or service-level? Analyze POST /api/checkout specifically."

```

## SLI Definition Framework

When recommending SLIs, follow this framework:

### For Web Services:
1. **Availability SLI** (required)
   - Metric: Request success rate
   - Target: 99.5-99.99% depending on criticality

2. **Latency SLI** (required)
   - Metric: P95 or P99 latency
   - Target: <500ms (P95) or <1000ms (P99)

3. **Throughput SLI** (optional)
   - Metric: Requests per second
   - Target: Baseline + buffer

### For Batch Jobs:
1. **Success Rate SLI**
2. **Duration SLI**
3. **Freshness SLI**

### For APIs:
1. **Endpoint Availability** (per critical endpoint)
2. **Endpoint Latency** (P95)
3. **Overall Service Availability**

## Error Budget Calculations

```

Error Budget = (1 - SLO_target) \* total_requests

Example:

- SLO: 99.9% (30 days)
- Expected requests: 10M
- Error budget: 0.1% × 10M = 10,000 errors allowed
- Current errors: 2,300
- Budget remaining: 77%

```

## Best Practices

1. **Start Conservative**: Set achievable targets based on current performance
2. **Iterate**: Tighten targets as reliability improves
3. **Monitor Budgets**: Alert when <20% budget remaining
4. **Review Quarterly**: Adjust targets based on business needs
5. **Balance Coverage**: Don't create SLOs for everything; focus on critical services

---

**This skill enables data-driven SLI/SLO definition using real APM metrics from your Datadog account!** 📊✨
```
