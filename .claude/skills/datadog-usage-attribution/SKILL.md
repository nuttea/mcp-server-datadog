---
name: datadog-usage-attribution
description: Analyze Datadog usage and costs, recommend optimal tags for usage attribution and chargeback. Identify which teams, services, or environments consume most resources. Use when user asks about Datadog costs, usage attribution, chargeback setup, or wants to optimize spending by tag.
---

# Datadog Usage Attribution Analysis

This skill analyzes your Datadog usage patterns and recommends optimal tags for cost allocation, chargeback, and usage attribution.

## When to use this skill

- User asks about "Datadog costs" or "usage attribution"
- User wants to set up "chargeback" or "cost allocation"
- User mentions "which team costs most" or "spending by service"
- User wants to "optimize Datadog costs"
- User asks "which tags should I use for billing"

## Background: Usage Attribution

Datadog's **Usage Attribution** feature lets you break down costs by up to **3 custom tag keys**. This enables:

- Department/team chargeback
- Project cost tracking
- Environment cost analysis
- Service-level cost allocation

**Key Constraint**: Can only configure **3 tag keys** for attribution!

## Analysis Workflow

### Step 1: Discover Current Tag Usage

**Objective**: Understand which tags are already widely used

**Tools**: `list_hosts`, `get_all_services`, `get_monitors`

**Actions**:

1. Get all hosts and extract unique tags
2. Get all services and their tags
3. Get all monitors and their tags
4. Calculate tag prevalence:
   ```javascript
   tag_coverage = {
     'env': {count: 234, percentage: 92%, values: ['dev','stage','prod']},
     'team': {count: 178, percentage: 67%, values: ['backend','frontend',...]},
     'service': {count: 245, percentage: 95%, values: [...]},
     ...
   }
   ```

**Output**:

```markdown
## Tag Usage Analysis

### Most Common Tags (by resource count):

| Tag Key     | Resources | Coverage | Unique Values | Cardinality |
| ----------- | --------- | -------- | ------------- | ----------- |
| env         | 234       | 92%      | 3             | Low ✅      |
| service     | 245       | 95%      | 12            | Medium ✅   |
| team        | 178       | 67%      | 8             | Low ✅      |
| application | 134       | 52%      | 6             | Low ✅      |
| tier        | 89        | 35%      | 4             | Low ✅      |
| region      | 210       | 82%      | 4             | Low ✅      |
| cost_center | 45        | 18%      | 15            | Medium ⚠️   |
```

---

### Step 2: Query Current Usage Metrics

**Objective**: Get ACTUAL usage data with current tag breakdown

**Tool**: `query_metrics`

**Actions**:

1. Query Datadog estimated usage metrics:

   ```
   - datadog.estimated_usage.hosts by {*}
   - datadog.estimated_usage.apm.hosts by {*}
   - datadog.estimated_usage.logs.ingested_bytes by {*}
   - datadog.estimated_usage.metrics.custom by {*}
   ```

2. These metrics show tags currently in use for attribution
3. Extract which tags are most prevalent in usage data

**Example Queries**:

```javascript
// Get infrastructure usage by team
query_metrics({
  query: "sum:datadog.estimated_usage.hosts{*} by {team}",
  from: <30 days ago>,
  to: <now>
})

// Get APM usage by service
query_metrics({
  query: "sum:datadog.estimated_usage.apm.hosts{*} by {service,env}",
  from: <30 days ago>,
  to: <now>
})

// Get log usage by team and env
query_metrics({
  query: "sum:datadog.estimated_usage.logs.ingested_bytes{*} by {team,env}",
  from: <30 days ago>,
  to: <now>
})
```

**Output**:

```markdown
## Actual Usage Data (from Datadog metrics)

### Infrastructure Usage (Hosts):

| Team          | Avg Hosts/Day | Percentage |
| ------------- | ------------- | ---------- |
| backend-team  | 45.3          | 32%        |
| frontend-team | 28.7          | 20%        |
| data-team     | 21.2          | 15%        |
| (no team tag) | 42.8          | 30% ⚠️     |

### APM Usage:

| Service        | Env  | Avg APM Hosts | Cost Weight |
| -------------- | ---- | ------------- | ----------- |
| store-backend  | prod | 12.5          | 35%         |
| store-frontend | prod | 8.3           | 23%         |
| data-pipeline  | prod | 6.2           | 17%         |

### Log Ingestion:

| Team          | GB/Day | Monthly GB | Est. Cost |
| ------------- | ------ | ---------- | --------- |
| backend-team  | 450    | 13,500     | $2,700    |
| frontend-team | 280    | 8,400      | $1,680    |
| (no tag)      | 320    | 9,600      | $1,920 ⚠️ |

**Key Finding**: 30% of infrastructure and ~25% of logs lack team attribution!
```

---

### Step 3: Analyze Resource Consumption Patterns

**Objective**: Combine metrics data with resource inventory

**Tools**: `list_hosts`, `get_service_stats_realtime`, `get_logs`, `query_metrics`

**Actions**:

1. **Infrastructure Usage Proxy**:

   - Count hosts per tag value
   - Higher host count = higher infrastructure costs

2. **APM Usage Proxy**:

   - Get service stats for request volumes
   - Higher request volume = higher APM costs

3. **Log Usage Proxy**:
   - Sample logs and count by service/team
   - Higher log volume = higher log costs

**Analysis Logic**:

```javascript
// Estimate usage distribution by tag
for (const tag of ['env', 'team', 'service', 'application']) {
  const distribution = calculateResourceDistribution(tag)

  // Example for 'team' tag:
  team_distribution = {
    'backend-team': {
      hosts: 45,
      services: 3,
      estimated_logs_pct: 35%,
      estimated_cost_pct: 32%
    },
    'frontend-team': {
      hosts: 28,
      services: 2,
      estimated_logs_pct: 18%,
      estimated_cost_pct: 21%
    }
  }
}
```

**Output**:

```markdown
## Estimated Usage Distribution

### By Team Tag (if used for attribution):

| Team          | Hosts | Services | Est. Log % | Est. Cost % |
| ------------- | ----- | -------- | ---------- | ----------- |
| backend-team  | 45    | 3        | 35%        | 32%         |
| frontend-team | 28    | 2        | 18%        | 21%         |
| data-team     | 12    | 2        | 25%        | 15%         |
| ops-team      | 15    | 0        | 8%         | 12%         |
| unknown       | 8     | 2        | 14%        | 20% ⚠️      |

**Insight**: 20% of costs can't be attributed (unknown team)
**Action**: Tag 8 hosts with team

### By Environment Tag (if used for attribution):

| Env   | Hosts | Services | Est. Cost % |
| ----- | ----- | -------- | ----------- |
| prod  | 67    | 7        | 68%         |
| stage | 23    | 5        | 22%         |
| dev   | 18    | 4        | 10%         |

**Insight**: Production accounts for 68% of costs
**Value**: Could validate if staging is over-provisioned

### By Service Tag (if used for attribution):

| Service        | Est. Cost % | Primary Cost Drivers                    |
| -------------- | ----------- | --------------------------------------- |
| store-backend  | 28%         | APM (high req rate), Logs (high volume) |
| store-frontend | 18%         | Infrastructure (many hosts), APM        |
| data-pipeline  | 22%         | Infrastructure, Metrics                 |
| monitoring     | 15%         | Logs, Metrics                           |
```

---

### Step 3: Recommend Optimal 3 Tags for Attribution

**Objective**: Choose the best 3 tags that provide maximum cost visibility

**Recommendation Framework**:

**Criteria for Good Attribution Tags**:

1. **High coverage** (>80% of resources tagged)
2. **Low cardinality** (<50 unique values)
3. **Business alignment** (maps to cost centers, teams, or products)
4. **Stable values** (doesn't change frequently)
5. **Actionable** (can take action based on insights)

**Scoring Each Tag**:

```javascript
tag_score =
  coverage * 0.3 +
  cardinality_score * 0.2 +
  business_value * 0.3 +
  actionability * 0.2
```

**Common Scenarios**:

#### **Scenario A: Chargeback to Teams**

**Recommended Tags**: `team`, `env`, `tier`

- **team**: Who to charge (primary dimension)
- **env**: Split by environment (prod costs more)
- **tier**: Priority level (helps with budgeting)

#### **Scenario B: Project-Based Billing**

**Recommended Tags**: `application`, `env`, `team`

- **application**: Which business project
- **env**: Environment costs
- **team**: Secondary ownership

#### **Scenario C: Service-Level Cost Analysis**

**Recommended Tags**: `service`, `env`, `team`

- **service**: Microservice cost breakdown
- **env**: Environment multiplier
- **team**: Ownership context

**Output**:

```markdown
## Recommended Tags for Usage Attribution

### Analysis Results:

| Tag         | Coverage | Cardinality | Business Value | Actionability | Score  |
| ----------- | -------- | ----------- | -------------- | ------------- | ------ |
| env         | 92%      | 3 ✅        | HIGH           | HIGH          | 95/100 |
| team        | 67%      | 8 ✅        | HIGH           | HIGH          | 85/100 |
| service     | 95%      | 12 ✅       | MEDIUM         | HIGH          | 88/100 |
| application | 52%      | 6 ✅        | HIGH           | MEDIUM        | 72/100 |
| tier        | 35%      | 4 ✅        | MEDIUM         | MEDIUM        | 58/100 |
| cost_center | 18%      | 15 ⚠️       | HIGH           | HIGH          | 62/100 |

### Top 3 Recommended Tags:

#### Option 1: Team Chargeback (RECOMMENDED)

**Tags**: `team`, `env`, `service`

**Rationale**:

- **team** (85 pts): 67% coverage, enables chargeback to 8 teams
- **env** (95 pts): 92% coverage, separates prod/stage/dev costs
- **service** (88 pts): 95% coverage, microservice-level detail

**What You'll Get**:

- Cost breakdown by team for chargeback
- Environment cost comparison (prod vs non-prod)
- Service-level cost tracking

**Missing Coverage**: 33% hosts without team tags
**Action Before Enabling**: Tag 53 hosts with team

#### Option 2: Application-Based

**Tags**: `application`, `env`, `tier`

**Rationale**:

- **application** (72 pts): Business project alignment
- **env** (95 pts): Environment costs
- **tier** (58 pts): Priority-based allocation

**Trade-off**: Lower coverage (52%) but better business alignment

#### Option 3: Service-First

**Tags**: `service`, `team`, `env`

**Best for**: SaaS/microservices architectures
**Provides**: Granular service cost visibility

### Recommendation for Your Account:

**Best Choice**: `team`, `env`, `service`

**Why**:

1. **team** - Enables department chargeback
2. **env** - Separates prod costs (typically 70%+)
3. **service** - Microservice cost details

**Before Implementation**:

1. Tag 53 hosts with team (improve from 67% → 87%)
2. Verify env tag standardization (dev/stage/prod only)
3. Confirm service tags match APM service names

**Expected Value**:

- Clear team chargeback for 87% of costs
- Environment cost comparison
- Identify expensive services for optimization
```

---

### Step 4: Pre-Implementation Readiness Check

**Actions**:

1. For chosen tags, verify:

   - Coverage is sufficient (>80%)
   - Values are standardized
   - Tag keys exist in all products (infra, APM, logs)

2. Check for tag gaps:

   - List resources without chosen tags
   - Estimate "unattributed" cost percentage

3. Validate tag values:
   - No CamelCase
   - Consistent naming
   - Bounded cardinality

**Output**:

```markdown
## Attribution Readiness Assessment

### Chosen Tags: team, env, service

#### Tag: team

- Coverage: 67% ⚠️ BELOW RECOMMENDED (target: >80%)
- Cardinality: 8 unique values ✅
- Standardization: ⚠️ 3 format issues found
  - "Backend Team" → should be "backend-team"
  - "Team-Frontend" → should be "frontend-team"

**Action Required**:

1. Tag 53 hosts with team
2. Fix 3 format violations
3. Estimated time: 2-3 hours

#### Tag: env

- Coverage: 92% ✅
- Cardinality: 3 unique values ✅ [dev, stage, prod]
- Standardization: ✅ All lowercase, consistent

**Ready**: ✅ No action needed

#### Tag: service

- Coverage: 95% ✅
- Cardinality: 12 unique values ✅
- Standardization: ✅ Consistent with APM

**Ready**: ✅ No action needed

### Readiness Score: 75/100

**Status**: ⚠️ Almost Ready
**Blocker**: Team tag coverage too low (67%)
**Timeline**: Fix team tagging → Re-check → Enable attribution (1 week)

### Estimated Unattributed Costs

With current coverage:

- 33% of infrastructure costs (missing team tags)
- 5% of APM costs (missing service tags)
- ~25-30% total costs may show as "unknown"

After remediation:

- <15% unattributed ✅
```

---

### Step 5: Usage Pattern Analysis

**Objective**: Once attribution is enabled (or estimate from current data), analyze usage patterns

**Current Capabilities** (without usage API):

- Estimate usage from resource counts
- Identify high-volume services from APM stats
- Identify high-log-volume services

**With Usage Attribution API** (future enhancement):

- Exact cost per tag value
- Historical usage trends
- Cost anomaly detection

**Output**:

```markdown
## Usage Insights (Estimated)

### Top Cost Drivers:

#### By Team:

1. backend-team: ~32% of total costs

   - Primary: Infrastructure (45 hosts), APM (high traffic)
   - Optimization: Review if all hosts needed

2. data-team: ~22% of total costs

   - Primary: Infrastructure (12 large hosts), Metrics
   - Optimization: Right-size instances?

3. frontend-team: ~21% of total costs
   - Primary: APM (high request rate), Logs
   - Optimization: Reduce log volume?

#### By Environment:

1. prod: ~68% of total costs ✅ Expected
2. stage: ~22% ⚠️ High - Review if over-provisioned
3. dev: ~10% ✅ Reasonable

#### By Service:

1. store-backend: ~28% (high APM, high logs)
2. data-pipeline: ~22% (infrastructure-heavy)
3. store-frontend: ~18%

### Optimization Opportunities:

**Quick Wins**:

1. **Staging Over-Provisioning**: 22% costs in stage

   - Recommendation: Scale down non-critical staging resources
   - Potential savings: ~$500/month

2. **Log Volume - backend-team**: 35% of all logs

   - Recommendation: Add exclusion filters, reduce DEBUG
   - Potential savings: ~$400/month

3. **Unused Hosts**: 8 hosts with no recent metrics
   - Recommendation: Review and potentially decommission
   - Potential savings: ~$200/month

**Total Potential Savings**: ~$1,100/month (15-20% reduction)
```

---

## Implementation Guide

### Step-by-Step: Enable Usage Attribution

#### 1. Prepare Tags (Before Enabling)

**Run this skill's analysis first**:

```
> "Analyze which tags I should use for Datadog usage attribution"
```

**Fix tag gaps based on recommendations**:

- Increase coverage to >80% for chosen tags
- Standardize tag values
- Document tag meanings

#### 2. Configure in Datadog

**Manual Steps** (Admin required):

1. Go to: https://app.datadoghq.com/billing/usage-attribution
2. Click "Edit Tags"
3. Select your 3 tags (e.g., `team`, `env`, `service`)
4. Save configuration

**Wait**: 24-48 hours for first data

#### 3. Monitor Attribution Quality

After 48 hours:

```
> "Check my usage attribution data quality"
```

Look for:

- **High "no tag" percentage**: Tags not widely adopted
- **Unexpected distributions**: Tag values may be wrong
- **Missing services/teams**: Some resources not tagged

#### 4. Create Cost Dashboards

**Recommended Widgets**:

1. **Usage by Team** (bar chart)
2. **Usage by Environment** (pie chart)
3. **Usage by Service** (treemap)
4. **Trend over Time** (timeseries)
5. **Unattributed Usage** (single value - should be <15%)

---

## Tag Recommendation Framework

### Factors to Consider:

#### 1. Business Model

**SaaS/Multi-tenant**:

- Primary: `customer_id` or `tenant`
- Secondary: `env`, `tier`

**Internal IT**:

- Primary: `team` or `department`
- Secondary: `env`, `cost_center`

**Project-Based**:

- Primary: `project` or `application`
- Secondary: `env`, `team`

#### 2. Organizational Structure

**Centralized Platform Team**:

- Use: `team`, `service`, `env`
- Chargeback to: Engineering teams

**Distributed Teams**:

- Use: `business_unit`, `cost_center`, `env`
- Chargeback to: Business units

#### 3. Cost Allocation Goals

**Simple Showback** (awareness only):

- Use: `team`, `env`
- Goal: Show teams their consumption

**Strict Chargeback** (actual billing):

- Use: `cost_center`, `env`, `tier`
- Goal: Bill internal customers accurately

**Service Cost Tracking**:

- Use: `service`, `env`, `tier`
- Goal: Understand per-service economics

---

## Decision Matrix

### Choose Your Top 3 Tags:

| Your Goal                 | Recommended Tags                      | Rationale                                                      |
| ------------------------- | ------------------------------------- | -------------------------------------------------------------- |
| **Team Chargeback**       | `team`, `env`, `service`              | Allocate costs to engineering teams by environment and service |
| **Business Unit Billing** | `business_unit`, `cost_center`, `env` | Corporate cost allocation with formal accounting               |
| **Product Economics**     | `product`, `env`, `tier`              | Track costs per business product line                          |
| **Multi-Tenant SaaS**     | `customer`, `env`, `tier`             | Bill customers for their usage                                 |
| **Service Cost Analysis** | `service`, `env`, `team`              | Optimize service-level economics                               |

---

## Advanced Analysis

### Cost Optimization Identification

**High-Cost, Low-Value Resources**:

1. **Staging Over-Provisioning**:

   ```
   If env:stage costs >25% of total → Likely over-provisioned
   Action: Scale down staging to 10-15% of prod
   ```

2. **Expensive Services**:

   ```
   Service costs >30% of APM → May need optimization
   Check: Request rate vs cost (cost per million requests)
   ```

3. **Team Resource Imbalance**:
   ```
   If team-A has 50% costs but <30% of engineers → Review
   ```

### Tag Cardinality Impact

**Low Cardinality** (1-20 values): ✅ IDEAL

- Easy to understand reports
- Clear chargeback
- Example: env, tier, region

**Medium Cardinality** (20-100 values): ⚠️ ACCEPTABLE

- May need grouping for reports
- Still manageable
- Example: team (if many teams), service

**High Cardinality** (>100 values): ❌ AVOID

- Unusable for attribution
- Performance issues
- Example: user_id, request_id, pod_name

---

## Output: Complete Recommendation Report

```markdown
# DATADOG USAGE ATTRIBUTION STRATEGY

**Date**: YYYY-MM-DD
**Analysis Period**: Past 7 days
**Current Attribution Status**: Not Configured / Configured with [tags]

---

## Executive Summary

Based on analysis of X hosts, Y services, and Z monitors:

**Recommended Attribution Tags**: `team`, `env`, `service`

**Expected Benefit**:

- 87% cost attribution (13% unattributed)
- Clear team chargeback
- Service-level cost tracking
- Environment cost comparison

**Prerequisites**:

- Tag 53 hosts with team (2-3 hours)
- Standardize 3 tag format violations
- Verify tag consistency

---

## Tag Analysis

### Tag #1: team (PRIMARY)

- **Coverage**: 67% → Target: 85% (tag 53 more hosts)
- **Cardinality**: 8 teams ✅
- **Business Value**: High - enables team chargeback
- **Action**: Add team tags to hosts, monitors, services

### Tag #2: env (SECONDARY)

- **Coverage**: 92% ✅
- **Cardinality**: 3 [dev, stage, prod] ✅
- **Business Value**: High - separate prod vs non-prod
- **Action**: None - ready to use

### Tag #3: service (TERTIARY)

- **Coverage**: 95% ✅
- **Cardinality**: 12 services ✅
- **Business Value**: Medium-High - service economics
- **Action**: None - ready to use

---

## Estimated Usage Distribution

[Include outputs from Step 2]

---

## Implementation Roadmap

### Week 1: Tag Preparation

- [ ] Add team tags to 53 hosts
- [ ] Fix 3 tag format violations
- [ ] Verify tag coverage >85%
- [ ] Document tag values

### Week 2: Enable Attribution

- [ ] Configure in Datadog UI: team, env, service
- [ ] Wait 24-48 hours for data

### Week 3: Validation

- [ ] Check attribution data quality
- [ ] Verify <15% unattributed
- [ ] Create cost dashboards

### Week 4+: Optimization

- [ ] Identify cost anomalies
- [ ] Implement chargeback process
- [ ] Monthly cost reviews by team

---

## Cost Optimization Opportunities

### Immediate Actions:

1. **Reduce Staging Costs**: ~$500/month
2. **Log Exclusions**: ~$400/month
3. **Decommission Unused Hosts**: ~$200/month

### After Attribution Enabled:

- Track cost per team (target: fair distribution)
- Alert on cost anomalies (>20% increase)
- Optimize highest-cost services

---

## Monitoring Post-Implementation

### Create Monitors:

1. **Unattributed Usage Alert**:
```

Alert when "no tag" usage >20%
→ Tags may have drifted

```

2. **Cost Anomaly Alert**:
```

Alert when team/service costs spike >30%
→ Investigation needed

```

3. **Tag Coverage Degradation**:
```

Alert when tag coverage drops <75%
→ New resources not tagged

```

---

## Alternative: If Coverage is Low

If your tag coverage is <60% for all business tags:

### Option: Use Infrastructure Tags

**Recommended**: `region`, `availability_zone`, `instance_type`
- **Coverage**: Usually 100% (auto-assigned by cloud)
- **Value**: Understand regional costs, instance sizing
- **Limitation**: Not business-aligned

### Option: Start Simple

**Phase 1**: Just use `env`
- Easiest to implement
- Immediate value (prod vs non-prod)
- Build coverage for other tags in parallel

**Phase 2**: Add `team` (6 months)
- After improving coverage to >80%

**Phase 3**: Add 3rd tag (12 months)
- `service`, `application`, or `cost_center`

---

## Success Metrics

After implementing usage attribution:

**Month 1**:
- ✅ Attribution enabled
- ✅ <20% unattributed costs
- ✅ Cost dashboards created

**Month 3**:
- ✅ <15% unattributed costs
- ✅ Teams understand their costs
- ✅ First optimization actions taken

**Month 6**:
- ✅ <10% unattributed costs
- ✅ Regular cost reviews by team
- ✅ Measurable cost reductions

---

## Usage Examples

### Initial Analysis
```

> "Analyze my Datadog account and recommend which tags to use for usage attribution"

Claude: _Uses this skill_

1. Analyzes tag coverage across resources
2. Estimates usage distribution by tag
3. Scores each tag option
4. Recommends optimal 3 tags
5. Provides implementation roadmap

```

### Readiness Check
```

> "Am I ready to enable usage attribution with team, env, service tags?"

Claude: _Uses this skill_

1. Checks coverage for specified tags
2. Identifies gaps
3. Lists prerequisites
4. Estimates unattributed percentage

```

### Optimization Analysis
```

> "Based on my Datadog usage, where can I save money?"

Claude: _Uses this skill_

1. Analyzes resource distribution
2. Identifies over-provisioning
3. Finds cost anomalies
4. Recommends optimizations

```

---

**This skill enables data-driven decisions for Datadog usage attribution setup and cost optimization!** 💰✨
```
