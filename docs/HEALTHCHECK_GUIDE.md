# Datadog Account Health Check Guide

> **Using MCP Tools with AI Prompts for Comprehensive Observability Analysis**

This guide shows how to perform Datadog account health checks using the 27 available MCP tools combined with AI orchestration.

---

## 📋 **Table of Contents**

1. [Infrastructure Health](#infrastructure-health)
2. [Monitor Quality](#monitor-quality)
3. [Log Management Efficiency](#log-management-efficiency)
4. [Service Performance & SLI/SLO](#service-performance--slislo)
5. [Dashboard Optimization](#dashboard-optimization)
6. [Automated Health Check Workflows](#automated-health-check-workflows)

---

## 1. Infrastructure Health

### **Objective**: Assess host coverage, agent deployment, and tagging compliance

### **AI Prompts**:

```
"Analyze my Datadog infrastructure health:
1. List all hosts and categorize by agent deployment
2. Check which hosts have env and team tags
3. Identify hosts missing critical tags
4. Show agent version distribution
5. Provide recommendations for tag coverage improvement"
```

### **Tools Used**:

- `list_hosts` - Get all hosts with metadata
- `get_active_hosts_count` - Get current active host count

### **What to Look For**:

- ✅ >90% hosts have `env` tag
- ✅ >80% hosts have `team` or business tags
- ✅ All production hosts have agent installed
- ⚠️ Hosts without tags (difficult to filter/alert)
- ⚠️ Outdated agent versions

### **Example Analysis**:

```bash
# In Kiro/Claude CLI:
> "Get all hosts and analyze tag coverage"

# Expected output analysis:
# - Total hosts: 45
# - With agent: 42 (93%)
# - With env tag: 38 (84%)
# - With team tag: 25 (55%) ⚠️ NEEDS IMPROVEMENT
# - Missing tags: 7 hosts
#
# Recommendation: Add team tags to improve ownership tracking
```

---

## 2. Monitor Quality

### **Objective**: Identify alert fatigue, coverage gaps, and routing issues

### **AI Prompts**:

```
"Perform monitor quality analysis:
1. Get all monitors and their trigger history
2. Identify monitors triggering >15 times in past week (alert fatigue)
3. Check monitors without priority tags
4. List monitors without team ownership
5. Analyze notification routing completeness
6. Recommend monitor consolidation or threshold adjustments"
```

### **Tools Used**:

- `get_monitors` - Get monitor configurations and status
- `get_logs` - Query for monitor trigger events
- `list_incidents` - Check incident correlation

### **What to Look For**:

- ✅ <5% monitors triggering >15x/week
- ✅ All monitors have priority tags (P1-P5)
- ✅ All monitors have team ownership
- ⚠️ High-frequency triggers = alert fatigue
- ⚠️ Monitors with no recent triggers = potentially outdated

### **Example Analysis**:

```bash
> "Analyze my monitors for alert fatigue and best practices"

# Expected analysis:
# - Total monitors: 234
# - High-frequency (>15 triggers/week): 12 (5%) ⚠️
# - Without priority tags: 45 (19%) ⚠️
# - Without team tags: 67 (29%) ⚠️
# - Never triggered: 23 (10%)
#
# Top alert fatigue monitors:
# 1. "CPU Usage High" - 47 triggers (consider anomaly detection)
# 2. "Disk Space Low" - 32 triggers (adjust threshold)
#
# Recommendations:
# - Add priority tags to 45 monitors
# - Review high-frequency monitors for threshold tuning
# - Archive 23 never-triggered monitors
```

---

## 3. Log Management Efficiency

### **Objective**: Optimize log indexing, parsing, and costs

### **AI Prompts**:

```
"Analyze log management efficiency:
1. Get logs from past week and calculate total volume
2. Check logs going through pipelines vs unparsed
3. Identify DEBUG logs being indexed (cost optimization)
4. Show log status distribution (info, warn, error)
5. Calculate exclusion ratio and potential savings
6. Recommend pipeline improvements and exclusion filters"
```

### **Tools Used**:

- `get_logs` - Sample logs and analyze attributes
- `get_all_services` - Identify services generating logs
- `query_metrics` - Get log ingestion metrics

### **What to Look For**:

- ✅ >70% logs go through pipelines (structured)
- ✅ DEBUG logs <10% of indexed volume
- ✅ Exclusion ratio >50% (filtering noise)
- ⚠️ Unparsed logs = missed insights
- ⚠️ High DEBUG indexing = wasted cost

### **Example Analysis**:

```bash
> "Analyze my log management and suggest optimizations"

# Expected analysis:
# - Total logs (7 days): 15.2M
# - Indexed: 4.8M (32% exclusion ratio) ⚠️ LOW
# - Through pipelines: 3.1M (65%) ✅
# - Unparsed: 1.7M (35%) ⚠️
# - DEBUG indexed: 890K (19%) ⚠️ HIGH
#
# Cost Impact:
# - Current: ~$2,400/month
# - If exclude DEBUG: Save ~$450/month
# - If improve exclusion to 60%: Save ~$800/month
#
# Recommendations:
# 1. Add exclusion filter for DEBUG logs
# 2. Create pipelines for 1.7M unparsed logs
# 3. Review services generating most noise
```

---

## 4. Service Performance & SLI/SLO

### **Objective**: Define SLIs, monitor SLOs, track error budgets

### **AI Prompts**:

```
"Perform SLI/SLO health check:
1. Get APM stats for all services (request rate, error rate, latency)
2. Identify services with >1% error rate (SLO risk)
3. List service endpoints and rank by error rate
4. Check current SLO compliance and error budgets
5. Recommend SLIs for services without SLOs
6. Suggest SLO targets based on current performance"
```

### **Tools Used**:

- `get_service_stats_realtime` - Real-time service performance
- `get_service_endpoints` - API endpoint discovery
- `get_operation_stats` - Per-endpoint analysis
- `list_slos` - Current SLO inventory
- `get_slo_history` - SLO trend analysis

### **What to Look For**:

- ✅ All critical services have SLOs
- ✅ Error budgets >20% remaining
- ✅ P95 latency <500ms for APIs
- ⚠️ Services with >1% error rate
- ⚠️ Endpoints with >5% error rate
- ⚠️ P99 latency spikes

### **Example Analysis**:

```bash
> "Analyze all services for SLI/SLO readiness and current performance"

# Expected analysis:
# Services analyzed: 7
#
# Service: store-backend
#   Request rate: 142.5 req/s
#   Error rate: 0.23% ✅
#   Latency: p50=98ms, p75=187ms, p95=456ms, p99=892ms
#   Endpoints: 23
#   High-error endpoints:
#     - POST /api/checkout: 2.1% error rate ⚠️
#     - GET /api/inventory: 1.8% error rate ⚠️
#   SLO: ✅ "Backend Availability" - 99.95% (target: 99.9%)
#
# Service: store-frontend
#   Request rate: 89.3 req/s
#   Error rate: 1.2% ⚠️ HIGH
#   Latency: p50=45ms, p75=89ms, p95=234ms
#   SLO: ❌ MISSING - Recommend creating
#
# Recommended SLIs:
# - store-backend: Already optimal
# - store-frontend: Create SLO with 99% availability target
# - puppeteer: Add error rate SLI (currently 3.4% errors)
#
# Overall Score: 72/100
# - SLO Coverage: 3/7 services (43%) - ADD MORE
# - Error Budget: Healthy (all >50%)
# - Performance: Good (P95 <500ms for all)
```

---

## 5. Dashboard Optimization

### **Objective**: Identify stale dashboards and improve organization

### **AI Prompts**:

```
"Analyze dashboard usage and quality:
1. List all dashboards
2. Check for dashboards not viewed in 90 days
3. Identify dashboards without template variables
4. Find duplicate or similar dashboards
5. Recommend consolidation and cleanup"
```

### **Tools Used**:

- `list_dashboards` - Get all dashboards
- `get_dashboard` - Analyze dashboard structure

### **What to Look For**:

- ✅ <10% stale dashboards (not viewed in 90 days)
- ✅ Critical dashboards have template variables
- ⚠️ Many similar dashboards = consolidate
- ⚠️ Dashboards without tags = hard to organize

---

## 6. Automated Health Check Workflows

### **Complete Health Check AI Prompt**:

```
"Perform a comprehensive Datadog account health check:

INFRASTRUCTURE:
- Analyze all hosts for agent deployment and tag coverage
- Identify gaps in env, team, and business tagging

MONITORS:
- Check for alert fatigue (monitors triggering >15x/week)
- Verify priority and team tag coverage
- Identify silent monitors (never triggered)

LOGS:
- Calculate exclusion ratio and indexing efficiency
- Check pipeline coverage for structured logging
- Identify DEBUG log indexing (cost optimization)

SERVICES & SLOs:
- Get APM stats for all services (error rates, latency)
- Analyze SLO coverage and compliance
- Identify high-error endpoints needing attention
- Recommend new SLIs/SLOs for uncovered services

DASHBOARDS:
- Find stale dashboards (not viewed in 90 days)
- Check for best practices (tags, template vars)

Provide:
1. Overall health score (0-100)
2. Findings by category with severity
3. Prioritized action items
4. Cost optimization opportunities
5. Best practice recommendations

Format as a structured report similar to a Datadog health check notebook."
```

---

## 🎯 **Implementation: Claude Skills**

Create reusable Claude Skills for health check workflows:

### **Skill 1: Infrastructure Health Check**

```yaml
# .claude/skills/datadog-infra-healthcheck.yaml
name: datadog-infra-healthcheck
description: Analyze Datadog infrastructure health including hosts, agents, and tagging
tools:
  - list_hosts
  - get_active_hosts_count
steps:
  - Get all hosts with metadata
  - Calculate agent deployment percentage
  - Analyze tag coverage (env, team, business tags)
  - Identify hosts missing critical tags
  - Generate score and recommendations
output:
  - Infrastructure health score (0-100)
  - Tag coverage statistics
  - Hosts needing attention
  - Actionable recommendations
```

### **Skill 2: Monitor Quality Check**

```yaml
# .claude/skills/datadog-monitor-quality.yaml
name: datadog-monitor-quality
description: Analyze monitor quality, alert fatigue, and notification routing
tools:
  - get_monitors
  - get_logs (for trigger events)
steps:
  - Get all monitors with status
  - Query logs for monitor trigger events (past 7 days)
  - Calculate trigger frequency per monitor
  - Identify alert fatigue (>15 triggers/week)
  - Check tag completeness (priority, team)
  - Analyze notification coverage
output:
  - Monitor quality score
  - Alert fatigue monitors (list)
  - Tag coverage gaps
  - Recommendations
```

### **Skill 3: SLI/SLO Analysis**

```yaml
# .claude/skills/datadog-slo-analysis.yaml
name: datadog-slo-analysis
description: Comprehensive SLI/SLO analysis for all services
tools:
  - get_all_services
  - get_service_stats_realtime
  - get_service_endpoints
  - list_slos
  - get_slo_history
steps:
  - Extract all services from logs
  - Get APM stats for each service (error rate, latency)
  - Get endpoints and identify high-error APIs
  - List existing SLOs
  - Compare services vs SLO coverage
  - Analyze error budget health
  - Recommend new SLOs for uncovered services
output:
  - Service performance summary
  - SLO coverage percentage
  - Services needing SLOs
  - High-risk endpoints
  - Error budget status
  - Recommended SLI definitions
```

### **Skill 4: Complete Account Health Check**

```yaml
# .claude/skills/datadog-account-healthcheck.yaml
name: datadog-account-healthcheck
description: Comprehensive Datadog account health analysis
depends_on:
  - datadog-infra-healthcheck
  - datadog-monitor-quality
  - datadog-slo-analysis
parameters:
  days: 7 # Analyze past 7 days
  sections: ['all'] # or specific: ["infrastructure", "monitors", "slos"]
steps:
  - Run infrastructure health check
  - Run monitor quality check
  - Run SLO analysis
  - Aggregate scores and findings
  - Prioritize action items
  - Calculate cost optimization opportunities
output:
  - Overall health score (0-100)
  - Section scores with details
  - Priority action items
  - Cost savings recommendations
  - Best practices compliance
```

---

## 💬 **Ready-to-Use AI Prompts**

### **Quick Health Checks** (5-10 min)

#### **Infrastructure Check**

```
"Check my Datadog infrastructure health:
- List all hosts
- Show how many have env and team tags
- Identify hosts missing critical tags
- Give me a score out of 100 and recommendations"
```

#### **Monitor Alert Fatigue**

```
"Analyze my monitors for alert fatigue:
- Get all monitors
- Which ones trigger most frequently?
- Show monitors without priority or team tags
- Recommend threshold adjustments"
```

#### **Service Performance**

```
"Analyze my service performance:
- Get stats for all services (store-backend, store-frontend, etc.)
- Show request rates, error rates, and p95 latency
- Identify services with >1% error rate
- Recommend SLOs for services that need them"
```

---

### **Comprehensive Health Check** (15-20 min)

```
"Perform a complete Datadog account health check for the past 7 days:

INFRASTRUCTURE:
1. List all hosts and analyze:
   - Agent deployment percentage
   - Tag coverage (env, team, cost_center)
   - Missing tags by host

2. Calculate scores:
   - Agent coverage score
   - Tagging completeness score

MONITORS:
1. Get all monitors
2. Analyze trigger frequency using logs:
   - Query: '@alert.monitor_name:* @evt.name:monitor.triggered' for past week
   - Calculate triggers per monitor
   - Identify alert fatigue (>15 triggers/week)

3. Check tag coverage:
   - Priority tags (P1-P5)
   - Team tags
   - Environment tags

SERVICES & SLOs:
1. Extract all services
2. For each service, get:
   - Request rate (req/s)
   - Error rate (%)
   - Latency percentiles (p50, p75, p95, p99)
   - API endpoints with stats

3. Check SLO coverage:
   - List all existing SLOs
   - Compare services with SLOs vs without
   - Analyze error budget health

4. Identify issues:
   - Services with >1% error rate
   - Endpoints with >5% error rate
   - P95 latency >1000ms

LOGS:
1. Sample logs from past week
2. Calculate:
   - Total log volume estimate
   - Services generating logs
   - Status distribution (debug, info, warn, error)

3. Identify:
   - DEBUG log percentage (should be <10%)
   - Unparsed logs (missing service tag)

DASHBOARDS:
1. List all dashboards
2. Check for:
   - Dashboards without tags
   - Potential stale dashboards

OVERALL:
- Calculate overall health score (0-100)
- Prioritize action items by impact
- Provide cost optimization recommendations
- Generate executive summary

Format the output as a comprehensive health check report with:
- Executive summary with overall score
- Detailed findings by section
- Priority action items (High/Medium/Low)
- Cost optimization opportunities
- Best practices recommendations
```

---

## 🔄 **Automated Workflows**

### **Daily Health Pulse** (1 min)

```
"Quick health pulse for today:
- Active hosts in last hour
- Monitors in alert state
- Services with errors in past hour
- SLOs under 99%
Give me a 30-second summary"
```

### **Weekly Health Review** (10 min)

```
"Weekly health review:
- Infrastructure: Tag coverage trends
- Monitors: New alert fatigue issues
- Services: Performance degradations
- SLOs: Error budget burn rate
- Action items from last week - any resolved?
Compare to last week and show improvements or regressions"
```

### **Monthly Deep Dive** (30 min)

```
"Monthly comprehensive health analysis:
- Full infrastructure audit
- Monitor effectiveness analysis
- Log cost optimization review
- SLO coverage expansion
- Dashboard cleanup recommendations
- Trend analysis vs previous month
Generate a monthly health report"
```

---

## 📊 **Health Check Scoring System**

### **Overall Health Score Calculation**

```
Infrastructure Health (25 points):
- Agent coverage: 10 points (>90% = full points)
- Tag coverage: 10 points (env + team + business)
- Agent versions: 5 points (all on latest)

Monitor Quality (25 points):
- Alert fatigue: 10 points (<5% high-frequency)
- Tag completeness: 10 points (priority + team)
- Coverage: 5 points (all critical services monitored)

Log Efficiency (20 points):
- Pipeline coverage: 8 points (>70%)
- Exclusion ratio: 7 points (>50%)
- DEBUG indexing: 5 points (<10%)

SLO Coverage (20 points):
- Service coverage: 10 points (all critical services)
- Compliance: 5 points (all SLOs >target)
- Error budgets: 5 points (all >20%)

Dashboard Health (10 points):
- Stale dashboards: 5 points (<10%)
- Tag coverage: 5 points (>80%)

Total: 100 points
- 90-100: Excellent
- 75-89: Good
- 60-74: Needs Improvement
- <60: Action Required
```

---

## 🎯 **Example: Complete Health Check Session**

```bash
# Start AI CLI (Kiro, Claude, Gemini)
kiro-cli

# Run comprehensive health check
> "Perform a complete Datadog account health check for Bangchak.
   Analyze infrastructure, monitors, logs, services, and SLOs.
   Use data from the past 7 days.
   Provide scores, findings, and prioritized recommendations.
   Format as a professional health check report."

# AI orchestrates:
# 1. list_hosts → Analyze infrastructure
# 2. get_monitors → Check alert quality
# 3. get_logs + get_all_services → Log analysis
# 4. get_service_stats_realtime × N → Service performance
# 5. get_service_endpoints × N → Endpoint discovery
# 6. list_slos → SLO coverage
# 7. list_dashboards → Dashboard health

# Generates comprehensive report:
---
DATADOG ACCOUNT HEALTH CHECK REPORT
Date: 2026-01-02
Customer: Bangchak
Period: Past 7 days

EXECUTIVE SUMMARY:
Overall Health Score: 72/100 (Needs Improvement)

Infrastructure: 85/100 ✅ Good
Monitors: 62/100 ⚠️ Needs Work
Logs: 58/100 ⚠️ Needs Work
SLOs: 65/100 ⚠️ Needs Work
Dashboards: 78/100 ✅ Good

CRITICAL ACTION ITEMS:
1. [HIGH] Add SLOs for 4 critical services without coverage
2. [HIGH] Fix 12 high-frequency monitors causing alert fatigue
3. [MEDIUM] Add exclusion filters for DEBUG logs (save ~$450/month)
4. [MEDIUM] Add team tags to 67 monitors
5. [LOW] Archive 23 never-triggered monitors

DETAILED FINDINGS:
[... comprehensive analysis ...]

COST OPTIMIZATION:
- Log exclusion improvements: $800/month savings
- Monitor consolidation: Reduce alert noise 40%

---
```

---

## 📝 **Creating Claude Skills Files**

### **Location**: `.claude/skills/`

Create these files in your repo:

```bash
mkdir -p .claude/skills

# Create skill files
touch .claude/skills/datadog-infra-health.md
touch .claude/skills/datadog-monitor-quality.md
touch .claude/skills/datadog-slo-analysis.md
touch .claude/skills/datadog-full-healthcheck.md
```

Each skill file defines:

- Name and description
- Required MCP tools
- Workflow steps
- Expected outputs
- Success criteria

---

## 🚀 **Quick Start**

1. **Ensure MCP server is running**:

   ```bash
   ./setup-kiro-datadog-mcp.sh
   ```

2. **Start AI CLI**:

   ```bash
   kiro-cli  # or gemini, or claude-code
   ```

3. **Run health check**:

   ```
   > "Run a Datadog infrastructure health check"
   > "Analyze my monitors for alert fatigue"
   > "Check SLO coverage for all services"
   ```

4. **Comprehensive analysis**:
   ```
   > "Perform complete Datadog account health check using all available MCP tools"
   ```

---

## 📖 **Advanced: Custom Health Checks**

Create custom health check scripts:

```bash
# custom-healthcheck.sh
#!/bin/bash

echo "Running Datadog Health Check..."

# Use AI to orchestrate
kiro-cli << EOF
Perform Datadog health check:
1. Get infrastructure stats
2. Analyze monitors
3. Check service performance
4. Review SLOs
Save results to healthcheck-report-$(date +%Y%m%d).md
EOF
```

---

## 🎯 **Next Steps**

1. ✅ **Try it now** - Use the prompts above with your MCP server
2. 📝 **Create skills** - Define Claude Skills for reusable workflows
3. 🔄 **Automate** - Schedule weekly/monthly health checks
4. 📊 **Track trends** - Compare reports over time

Your 27 MCP tools provide all the data needed for comprehensive Datadog account health checks - just let the AI orchestrate! 🏥✨

---

**With your enhanced MCP server, you can now perform the same professional health checks that Datadog CSMs deliver, completely automated through AI!** 🎊
