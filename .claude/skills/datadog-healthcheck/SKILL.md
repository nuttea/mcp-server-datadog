---
name: datadog-healthcheck
description: Perform comprehensive Datadog account health checks analyzing infrastructure, monitors, logs, services, and SLOs. Use when the user asks to analyze Datadog health, check account configuration, identify issues, or wants recommendations for Datadog best practices.
---

# Datadog Account Health Check

This skill performs professional-grade Datadog account health checks using MCP tools, providing scores, findings, and actionable recommendations.

## When to use this skill

- User asks to "check Datadog health" or "analyze my Datadog account"
- User wants to identify Datadog configuration issues
- User needs recommendations for Datadog best practices
- User mentions "health check", "account analysis", or "optimization"

## Available MCP Tools

This skill uses the Datadog MCP server tools (27 total):

- Infrastructure: `list_hosts`, `get_active_hosts_count`
- Monitors: `get_monitors`
- Logs: `get_logs`, `get_all_services`
- SLOs: `list_slos`, `get_slo`, `get_slo_history`
- APM: `get_service_stats_realtime`, `get_service_endpoints`, `get_operation_stats`
- Dashboards: `list_dashboards`

## Health Check Workflow

### Step 1: Infrastructure Health (25 points)

**Objective**: Assess host coverage, agent deployment, and tagging compliance

**Actions**:

1. Call `list_hosts` with `include_hosts_metadata: true`
2. Count:
   - Total hosts
   - Hosts with agent vs cloud-only
   - Hosts with `env` tag
   - Hosts with `team` tag
3. Calculate percentages and score

**Scoring**:

- Agent coverage >90%: 10/10 points
- Env tag coverage >85%: 8/8 points
- Team tag coverage >75%: 7/7 points

**Example**:

```
Infrastructure Health: 21/25

Total Hosts: 45
- With Agent: 42 (93%) ✅ 10/10
- With env tag: 38 (84%) ⚠️ 7/8
- With team tag: 25 (55%) ⚠️ 3/7

Issues:
- 7 hosts missing env tags
- 20 hosts missing team tags

Recommendations:
1. Add env tags to 7 hosts for better filtering
2. Add team tags to improve ownership (target: 75%+)
```

---

### Step 2: Monitor Quality (25 points)

**Objective**: Identify alert fatigue, coverage gaps, and routing issues

**Actions**:

1. Call `get_monitors` to get all monitors
2. For each monitor, check tags for:
   - Priority (P1-P5)
   - Team ownership
   - Environment
3. Use `get_logs` with query `@evt.name:monitor.triggered` to estimate trigger frequency
4. Calculate score

**Scoring**:

- Alert fatigue <5%: 10/10 points
- Priority tags >90%: 10/10 points
- Coverage adequate: 5/5 points

**Example**:

```
Monitor Quality: 18/25

Total Monitors: 234
- High-frequency (>15 triggers/week): 12 (5%) ⚠️ 9/10
- Without priority tags: 45 (19%) ⚠️ 8/10
- Without team tags: 67 (29%) ⚠️ 1/5

Alert Fatigue Monitors:
1. "CPU Usage High" - Estimated 40+ triggers
2. "Disk Space Low" - Estimated 30+ triggers

Recommendations:
1. Review thresholds for 12 high-frequency monitors
2. Add priority tags to 45 monitors (use P1-P5)
3. Add team tags for routing (67 monitors need this)
```

---

### Step 3: Log Efficiency (20 points)

**Objective**: Optimize log indexing, parsing, and costs

**Actions**:

1. Call `get_logs` with query `*` to sample logs (limit: 1000)
2. Call `get_all_services` to get service list
3. Analyze sample:
   - Status distribution (debug, info, warn, error)
   - Services with/without proper tags
   - Estimate DEBUG percentage
4. Calculate efficiency score

**Scoring**:

- Pipeline coverage estimated >70%: 8/8 points
- DEBUG <10%: 7/7 points
- Tag coverage >90%: 5/5 points

**Example**:

```
Log Efficiency: 14/20

Services: 7
Sample analyzed: 1000 logs

Status Distribution:
- ERROR: 5%
- WARN: 12%
- INFO: 64%
- DEBUG: 19% ⚠️ HIGH

Estimated Cost Impact:
- DEBUG logs: ~19% of volume
- Potential savings: $450/month if excluded

Recommendations:
1. Add exclusion filter for DEBUG logs
2. Review which services need DEBUG in production
3. Consider log levels per environment
```

---

### Step 4: SLO & Service Performance (20 points)

**Objective**: Analyze SLO coverage, service performance, and error budgets

**Actions**:

1. Call `get_all_services` to list all services
2. For each service:
   - Call `get_service_stats_realtime` (request rate, error rate, latency)
   - Call `get_service_endpoints` (top endpoints)
3. Call `list_slos` to get all SLOs
4. Compare service list vs SLO coverage
5. Analyze error budgets and compliance

**Scoring**:

- SLO coverage for critical services: 10/10 points
- All SLOs above target: 5/5 points
- Error budgets >20%: 5/5 points

**Example**:

```
SLO & Performance: 13/20

Services: 7
SLOs: 3
Coverage: 43% ⚠️ 4/10

Service Performance:
✅ store-backend
   - Request rate: 142.5 req/s
   - Error rate: 0.23%
   - P95 latency: 456ms
   - SLO: "Backend Availability" 99.95% ✅

⚠️ store-frontend
   - Request rate: 89.3 req/s
   - Error rate: 1.2% ⚠️ HIGH
   - P95 latency: 234ms
   - SLO: MISSING ❌

⚠️ puppeteer
   - Error rate: 3.4% ⚠️ VERY HIGH
   - SLO: MISSING ❌

Services Needing SLOs: 4
- store-frontend (1.2% error rate)
- puppeteer (3.4% error rate)
- store-discounts
- webserver

Recommendations:
1. Create SLOs for 4 services without coverage
2. Investigate puppeteer high error rate (3.4%)
3. Set availability target: 99% for non-critical, 99.9% for critical
```

---

### Step 5: Dashboard Health (10 points)

**Objective**: Identify stale dashboards and organization

**Actions**:

1. Call `list_dashboards`
2. Check:
   - Dashboards without tags
   - Naming conventions
3. Calculate score

**Scoring**:

- Tag coverage >80%: 5/5 points
- Organization: 5/5 points

**Example**:

```
Dashboard Health: 8/10

Total Dashboards: 28
- Without tags: 6 (21%) ⚠️ 4/5
- Well organized: ✅ 5/5

Recommendations:
1. Add tags to 6 dashboards for better organization
2. Use naming convention: "[Team] - [Purpose]"
```

---

## Final Report Generation

### Calculate Overall Score

Sum all section scores:

```
Infrastructure: XX/25
Monitors: XX/25
Logs: XX/20
SLOs: XX/20
Dashboards: XX/10
---
TOTAL: XX/100
```

### Health Status

- **90-100**: Excellent ✅
- **75-89**: Good ✅
- **60-74**: Needs Improvement ⚠️
- **<60**: Action Required ❌

### Prioritize Action Items

**HIGH Priority** (implement within 1 week):

- Scores <15/section
- Security/compliance issues
- Cost optimization >$500/month
- Critical service issues (>5% error rate)

**MEDIUM Priority** (implement within 1 month):

- Scores 15-20/section
- Efficiency improvements
- Tag coverage gaps
- Monitor optimization

**LOW Priority** (nice-to-have):

- Scores >20/section
- Minor optimizations
- Best practice enhancements

### Generate Report

Output format:

```markdown
# DATADOG ACCOUNT HEALTH CHECK REPORT

**Date**: YYYY-MM-DD
**Period**: Past 7 days
**Overall Score**: XX/100 - [Status]

---

## Executive Summary

Your Datadog account health is [Excellent/Good/Needs Improvement/Action Required].

Key Highlights:

- ✅ [Positive finding]
- ⚠️ [Issue requiring attention]
- ❌ [Critical issue]

---

## Detailed Scores

| Category       | Score | Status | Notes |
| -------------- | ----- | ------ | ----- |
| Infrastructure | XX/25 | ✅/⚠️  | ...   |
| Monitors       | XX/25 | ✅/⚠️  | ...   |
| Logs           | XX/20 | ✅/⚠️  | ...   |
| SLOs           | XX/20 | ✅/⚠️  | ...   |
| Dashboards     | XX/10 | ✅/⚠️  | ...   |

---

## Priority Action Items

### 🔴 HIGH Priority

1. [Action] - Impact: [description]
2. [Action] - Impact: [description]

### 🟡 MEDIUM Priority

1. [Action] - Impact: [description]

### 🟢 LOW Priority

1. [Action] - Impact: [description]

---

## Cost Optimization Opportunities

Total potential savings: $X/month

1. Log exclusions: $X/month
2. Monitor consolidation: Reduce noise by Y%
3. [Other optimizations]

---

## Detailed Findings

[Include all section outputs from Steps 1-5]

---

## Next Steps

1. Address HIGH priority items
2. Schedule follow-up in 30 days
3. Track improvements

---

_Report generated by Datadog MCP Health Check Skill_
_Tools used: [list of MCP tools called]_
```

## Usage Examples

### Basic Health Check

```
User: "Check my Datadog health"

Claude: *Uses this skill*
1. Calls list_hosts
2. Calls get_monitors
3. Calls get_all_services
4. Generates scored report
```

### Focused Analysis

```
User: "Check just my monitors and SLOs"

Claude: *Uses this skill, focuses on relevant sections*
1. Skips infrastructure
2. Analyzes monitors
3. Analyzes SLOs
4. Provides targeted recommendations
```

### Scheduled Health Checks

```
User: "Run weekly Datadog health check and save to reports/"

Claude: *Uses this skill*
1. Performs full analysis
2. Generates report
3. Saves as reports/healthcheck-YYYYMMDD.md
```

## Tips for Best Results

1. **Time Range**: Default to 7 days; use 30 days for trends
2. **Detail Level**: Adjust based on user needs (executive vs technical)
3. **Comparison**: Compare to previous reports if available
4. **Context**: Include account-specific knowledge (criticality, teams, etc.)
5. **Actionability**: Every recommendation should be specific and implementable

## Common Issues

**Issue**: Missing MCP tools

- **Solution**: Verify Datadog MCP server is configured and running

**Issue**: Authentication errors

- **Solution**: Check DATADOG_API_KEY and DATADOG_APP_KEY are set

**Issue**: Timeout on large accounts

- **Solution**: Reduce time range or analyze sections separately

## Advanced Features

### Trend Analysis

Compare current scores to previous health checks:

```
> "Run health check and compare to last month's report"
```

### Custom Scoring

Adjust scoring weights based on priorities:

```
> "Run health check prioritizing SLO coverage (40 points instead of 20)"
```

### Export Formats

Generate reports in different formats:

```
> "Run health check and export as JSON for automation"
> "Run health check and create PowerPoint presentation"
```

---

**This skill transforms 27 MCP tools into a comprehensive, automated Datadog health check system!** 🏥
