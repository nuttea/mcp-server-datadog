---
name: datadog-tagging-strategy
description: Analyze Datadog tagging compliance and coverage across infrastructure, services, monitors, and logs. Check adherence to tagging standards (env, team, tier, etc.), identify gaps, and recommend improvements. Use when user asks about tagging strategy, tag coverage, tag compliance, or wants to audit their Datadog tags.
---

# Datadog Tagging Strategy Analysis

This skill analyzes your Datadog account's tagging compliance based on industry best practices and organizational standards. It checks tag coverage across all resources and provides actionable recommendations.

## When to use this skill

- User asks about "tagging strategy" or "tag compliance"
- User wants to "audit tags" or "check tag coverage"
- User mentions "missing tags", "tag standards", or "tagging best practices"
- User references notebooks/operational-standards-tagging-strategy.md
- User wants to identify untagged resources

## Tagging Framework

### Reserved Tags (Critical - Must Have)

| Tag       | Scope          | Purpose                      | Target Coverage |
| --------- | -------------- | ---------------------------- | --------------- |
| `env`     | All            | Environment (dev/stage/prod) | >95%            |
| `service` | APM, Logs      | Service identification       | >90%            |
| `version` | APM            | Application version          | >80%            |
| `source`  | Logs           | Log source/technology        | >90%            |
| `host`    | Infrastructure | Hostname (auto)              | 100%            |
| `device`  | Infrastructure | Disk/network device          | 100%            |

### Recommended Tags (Should Have)

| Tag           | Priority | Purpose                 | Target Coverage |
| ------------- | -------- | ----------------------- | --------------- |
| `team`        | CRITICAL | Ownership & routing     | >85%            |
| `runtime`     | HIGH     | Framework/technology    | >75%            |
| `journey`     | HIGH     | User flow tracking      | >60%            |
| `role`        | HIGH     | Service function        | >75%            |
| `application` | HIGH     | Business application    | >80%            |
| `tier`        | MEDIUM   | Criticality (1-4)       | >70%            |
| `backup`      | MEDIUM   | Backup strategy         | >60%            |
| `platform`    | MEDIUM   | Infrastructure platform | >65%            |
| `product`     | MEDIUM   | Business product        | >60%            |
| `network`     | MEDIUM   | Network segment         | >50%            |
| `compliance`  | MEDIUM   | Regulations (PCI, GDPR) | >50%            |
| `datatype`    | MEDIUM   | Data classification     | >50%            |
| `datacenter`  | MEDIUM   | Physical location       | >60%            |

## Analysis Workflow

### Step 1: Infrastructure Tag Audit

**Tool**: `list_hosts` with `include_hosts_metadata: true`

**Actions**:

1. Get all hosts with tags
2. For each host, check presence of:

   - **Reserved**: env, host
   - **Critical**: team
   - **Recommended**: tier, role, datacenter, platform

3. Calculate coverage percentages:

   ```javascript
   env_coverage = (hosts_with_env / total_hosts) * 100
   team_coverage = (hosts_with_team / total_hosts) * 100
   ```

4. Identify violations:
   - Hosts without env tag (critical)
   - Hosts without team tag (critical)
   - Hosts with invalid env values (not in [dev, stage, prod])

**Output**:

```markdown
## Infrastructure Tagging: XX/100

Total Hosts: N

### Reserved Tags Coverage:

- env: X% (Y/N hosts) ✅/⚠️/❌
- host: 100% (auto-assigned) ✅

### Critical Tags Coverage:

- team: X% (Y/N hosts) ⚠️
  Target: >85%
  Gap: Z hosts need team tags

### Recommended Tags Coverage:

- tier: X% (Y/N hosts)
- role: X% (Y/N hosts)
- datacenter: X% (Y/N hosts)

### Hosts Missing Critical Tags:

1. hostname-1: Missing env, team
2. hostname-2: Missing team
3. hostname-3: Missing env

### Tag Value Violations:

- host-abc: env=development ⚠️ (should be 'dev', 'stage', or 'prod')
- host-xyz: team=Team-A ⚠️ (CamelCase not recommended, use team-a)

### Score Calculation:

- Reserved tags: X/40 pts
- Critical tags: X/40 pts
- Recommended tags: X/20 pts
  Total: XX/100
```

---

### Step 2: Service (APM) Tag Audit

**Tools**: `get_all_services`, `list_traces`, `get_service_stats_realtime`

**Actions**:

1. Get all services from logs
2. For each service, call `list_traces` to sample span tags
3. Extract tags from traces:

   - service (should always be present)
   - env
   - version
   - team
   - runtime
   - journey (if applicable)

4. Check Unified Service Tagging (UST) compliance:
   - service + env + version = Complete UST ✅

**Output**:

```markdown
## APM Service Tagging: XX/100

Services Discovered: N

### Unified Service Tagging (UST) Compliance:

- Complete (service + env + version): X/N (Y%) ⚠️
- Partial (service + env): X/N (Y%)
- Minimal (service only): X/N (Y%)

### Tag Coverage by Service:

#### store-backend ✅

- service: ✅ store-backend
- env: ✅ prod
- version: ✅ v2.1.3
- team: ✅ backend-team
- runtime: ❌ MISSING
- tier: ✅ 1
  UST: Complete ✅

#### store-frontend ⚠️

- service: ✅ store-frontend
- env: ✅ prod
- version: ❌ MISSING
- team: ❌ MISSING
- runtime: ❌ MISSING
  UST: Partial ⚠️

### Services Needing Tags:

1. store-frontend: Add version, team, runtime
2. puppeteer: Add env, version, team
3. webserver: Add team, tier

### Recommendations:

1. Implement version tagging in deployment pipeline
2. Add team tags to all services for ownership
3. Add runtime tags (python, java, node) for stack visibility
```

---

### Step 3: Monitor Tag Compliance

**Tool**: `get_monitors`

**Actions**:

1. Get all monitors
2. For each monitor, check tags:

   - **Required**: service, env
   - **Critical**: team (for routing), priority (P1-P5)
   - **Recommended**: tier, application

3. Check tag format:
   - Lowercase compliance
   - No CamelCase
   - Key:value format

**Output**:

```markdown
## Monitor Tagging: XX/100

Total Monitors: N

### Required Tags:

- service tag: X% (Y/N) ⚠️
- env tag: X% (Y/N)

### Critical Tags (for alerting):

- team tag: X% (Y/N) ⚠️ BELOW TARGET
- priority tag: X% (Y/N)

### Monitors Missing Critical Tags:

1. "CPU High" - Missing: team, priority
2. "Disk Space" - Missing: team
3. "API Errors" - Missing: priority

### Tag Format Issues:

- Monitor "X": Uses CamelCase tag "TeamName" → Should be "team_name"
- Monitor "Y": Tag "ENV:Prod" → Should be lowercase "env:prod"

### Recommendations:

1. Add team tags to X monitors for proper routing
2. Add priority tags (P1-P5) to X monitors
3. Fix Y tag format violations
4. Use consistent tag naming: team:backend-team (not Team:Backend-Team)
```

---

### Step 4: Log Tag Coverage

**Tool**: `get_logs` with sample query

**Actions**:

1. Sample logs (1000-5000) from past week
2. Check each log for:

   - service tag (critical for APM correlation)
   - source tag (critical for parsing)
   - host tag (infrastructure correlation)
   - status tag (for log levels)

3. Calculate coverage from sample

**Output**:

```markdown
## Log Tagging: XX/100

Sample Size: 1000 logs

### Reserved Tags Coverage:

- service: X% of logs ⚠️
- source: X% of logs
- host: X% of logs

### Logs Without service Tag:

- Count: X (Y% of sample)
- Impact: Cannot correlate with APM
- Services affected: [list]

### Logs Without source Tag:

- Count: X
- Impact: May not be parsed correctly
- Sources affected: [list]

### Recommendations:

1. Configure service tag for X log sources
2. Add source tag to identify technology (nginx, python, etc.)
3. Enable structured logging with JSON format
```

---

### Step 5: Dashboard & SLO Tag Organization

**Tools**: `list_dashboards`, `list_slos`

**Actions**:

1. Get all dashboards and check for tags
2. Get all SLOs and check for tags
3. Verify organization and discoverability

**Output**:

```markdown
## Dashboard & SLO Tagging: XX/100

### Dashboards:

- Total: N
- With tags: X (Y%)
- Without tags: Z (W%) ⚠️

### SLOs:

- Total: N
- With tags: X (Y%)
- Without tags: Z (W%)

### Organization Impact:

- Dashboards without tags are hard to discover
- SLOs without tags can't be filtered by team/service

### Recommendations:

1. Add tags to X dashboards: team, service, env
2. Add tags to Y SLOs for filtering
3. Use consistent tagging: service:backend, team:platform
```

---

### Step 6: Tag Value Standardization

**Actions**:

1. Collect all unique tag values across resources
2. Check for:
   - CamelCase violations (should be lowercase)
   - Inconsistent values (dev vs development vs DEV)
   - Special characters (converted to underscores)
   - Unbounded tags (timestamps, UUIDs)

**Output**:

```markdown
## Tag Standardization Issues

### CamelCase Violations:

- TeamName → team_name
- EnvProd → env_prod
  Fix: Convert to lowercase with underscores

### Inconsistent Values:

- env tag values: [dev, development, DEV, devel]
  → Standardize to: [dev, stage, prod]

- team tag values: [backend-team, Backend Team, backend_team]
  → Standardize to: backend-team (use hyphens)

### Unbounded Tags Detected: ⚠️

- user_id:12345, user_id:67890 (high cardinality)
- request_id:abc-123, request_id:def-456
  → Risk: Tag explosion, performance issues
  → Recommendation: Remove or move to log attributes

### Special Character Handling:

Tags with spaces/special chars are converted to underscores:

- "Team Name" → team_name ✅
- "env@prod" → env_prod ✅
```

---

## Complete Report Format

````markdown
# DATADOG TAGGING COMPLIANCE REPORT

**Date**: YYYY-MM-DD
**Resources Analyzed**: Hosts (N), Services (M), Monitors (X), Logs (sample), Dashboards (Y)
**Overall Compliance Score**: XX/100

---

## Executive Summary

Tagging compliance: [Excellent/Good/Needs Improvement/Poor]

Key Findings:

- ✅ Infrastructure env tag coverage: 92%
- ⚠️ Team tag coverage: 67% (target: 85%)
- ⚠️ 45 monitors without routing tags
- ❌ 4 services missing UST (service+env+version)

---

## Compliance by Category

| Resource Type  | Score  | Key Issues           |
| -------------- | ------ | -------------------- |
| Infrastructure | XX/100 | Team tags needed     |
| APM Services   | XX/100 | Version tags missing |
| Monitors       | XX/100 | Priority & team tags |
| Logs           | XX/100 | Service tag gaps     |
| Dashboards     | XX/100 | Untagged dashboards  |

---

## Priority Action Items

### 🔴 HIGH Priority (Implement in 1 week)

1. Add env tags to X hosts (required for filtering)
2. Add team tags to Y monitors (required for routing)
3. Implement UST (service+env+version) for Z services

### 🟡 MEDIUM Priority (Implement in 1 month)

1. Add tier tags to classify criticality
2. Standardize tag values (fix CamelCase, inconsistencies)
3. Add runtime tags to services

### 🟢 LOW Priority (Nice to have)

1. Add journey tags for user flow tracking
2. Add application tags for business grouping
3. Organize dashboards with tags

---

## Tag Coverage Details

[Include outputs from Steps 1-5]

---

## Tagging Best Practices

### DO:

✅ Use lowercase tags: `env:prod` not `Env:Prod`
✅ Use consistent separators: `team-name` not `Team Name`
✅ Include UST for all services: service, env, version
✅ Add team tags for ownership and routing
✅ Document allowed tag values

### DON'T:

❌ Use CamelCase: `TeamName`
❌ Use unbounded values: user_id, request_id, timestamp
❌ Mix formats: `env:prod` and `environment:production`
❌ Include special characters (they become underscores)

---

## Implementation Guide

### Quick Wins (Can do today):

1. **Add env tags to infrastructure**:
   ```bash
   # For AWS: Use terraform/cloudformation tags
   # For hosts: Update datadog.yaml
   tags:
     - env:prod
     - team:platform
   ```
````

2. **Add priority tags to monitors**:

   - Edit monitors in Datadog UI
   - Add tag: `priority:p1` (or p2, p3, p4, p5)

3. **Enable UST for services**:
   ```bash
   # Set environment variables in deployment
   DD_ENV=prod
   DD_SERVICE=store-backend
   DD_VERSION=v2.1.3
   ```

### Long-term Implementation:

1. **Define Tag Policy Document**:

   - Allowed values for each tag
   - Required vs optional tags per resource type
   - Naming conventions

2. **Automate Tag Compliance**:

   - Use Terraform/IaC to enforce tags
   - CI/CD checks for tag presence
   - Regular audits (use this skill!)

3. **Monitor Tag Health**:
   - Create monitors for tag coverage
   - Alert when coverage drops below thresholds

---

## Advanced Analysis

### Tag Cardinality Check

**Objective**: Detect unbounded tags causing performance issues

**Method**:

1. Sample traces/logs (1000+)
2. Count unique values per tag key
3. Flag tags with >1000 unique values

**Example**:

```
High Cardinality Tags Detected: ⚠️
- user_id: 8,234 unique values
- request_id: 12,456 unique values
- session_token: 5,678 unique values

Impact:
- High memory usage
- Slower queries
- Potential performance degradation

Recommendation:
- Remove from tags, use as log/span attributes instead
- Or convert to bounded categories (e.g., user_tier:premium)
```

### Tag Consistency Check

**Objective**: Find inconsistent tag values that should be standardized

**Method**:

1. Collect all values for each tag key
2. Identify similar but different values
3. Recommend standardization

**Example**:

```
Inconsistent Tag Values:

env tag:
- Found: [dev, development, DEV, devel, dev-env]
- Standard: [dev, stage, prod]
- Fix: Standardize all to 'dev'

team tag:
- Found: [backend-team, Backend Team, backend_team, BackendTeam]
- Standard: backend-team (lowercase, hyphen-separated)
- Fix: Standardize all to 'backend-team'
```

---

## Integration with Health Check

This skill complements the `datadog-healthcheck` skill:

- `datadog-healthcheck`: Broad account analysis including tagging
- `datadog-tagging-strategy`: Deep-dive tagging-specific analysis

Use both together:

```
> "Run full health check with deep tagging analysis"
```

---

## Usage Examples

### Basic Tagging Audit

```
> "Check my Datadog tag coverage"

Claude: *Uses this skill*
1. Calls list_hosts → Checks infrastructure tags
2. Calls get_monitors → Checks monitor tags
3. Calls get_all_services → Checks service tags
4. Generates compliance report
```

### Focused Analysis

```
> "Check which monitors are missing team tags"

Claude: *Uses this skill, focuses on monitors*
1. Calls get_monitors
2. Filters for missing team tags
3. Provides list and remediation steps
```

### Compliance Tracking

```
> "Compare my tag coverage to last month and show improvements"

Claude: *Uses this skill*
1. Runs current analysis
2. Compares to previous report
3. Shows progress and remaining gaps
```

---

## Remediation Workflows

### For Infrastructure (Hosts)

**Missing env tags**:

```bash
# Option 1: Update datadog.yaml
tags:
  - env:prod
  - team:platform
  - tier:1

# Option 2: AWS/Cloud tags (inherited automatically)
# Tag EC2 instances, Datadog picks up automatically
```

### For APM (Services)

**Missing UST (service/env/version)**:

```bash
# Set via environment variables
export DD_ENV=prod
export DD_SERVICE=store-backend
export DD_VERSION=v2.1.3

# Or in code (tracer initialization)
tracer.init({
  env: 'prod',
  service: 'store-backend',
  version: 'v2.1.3'
})
```

### For Monitors

**Missing team/priority tags**:

1. Open monitor in Datadog UI
2. Add tags:
   - `team:backend-team` (for routing with notification rules)
   - `priority:p1` (for severity classification)
   - `service:store-backend` (for correlation)

### For Logs

**Missing service/source tags**:

```yaml
# In log collection config
logs:
  - type: file
    path: /var/log/app.log
    service: store-backend # Add this
    source: python # Add this
    tags:
      - env:prod
      - team:backend-team
```

---

## Scoring System

### Infrastructure (40 points):

- env tag: 20 pts (>95% = full)
- team tag: 15 pts (>85% = full)
- tier tag: 5 pts (>70% = full)

### Services (30 points):

- UST complete: 20 pts (>80% = full)
- team tag: 10 pts (>85% = full)

### Monitors (20 points):

- team tag: 10 pts (>90% = full)
- priority tag: 10 pts (>90% = full)

### Logs & Dashboards (10 points):

- service tag in logs: 5 pts
- Dashboard tags: 5 pts

**Total: 100 points**

- 90-100: Excellent ✅
- 75-89: Good ✅
- 60-74: Needs Improvement ⚠️
- <60: Action Required ❌

---

## Best Practices Enforcement

### 1. Lowercase Only

```
✅ env:prod
❌ Env:Prod
❌ ENV:PROD
```

### 2. Consistent Separators

```
✅ backend-team (hyphens)
✅ backend_team (underscores) - if consistent
❌ Backend Team (spaces)
❌ BackendTeam (CamelCase)
```

### 3. Bounded Values

```
✅ env:[dev, stage, prod]
✅ tier:[1, 2, 3, 4]
❌ user_id:[12345, 67890, ...] (unbounded)
❌ timestamp:[1234567890, ...] (unbounded)
```

### 4. Unified Service Tagging

```
✅ service:store-backend, env:prod, version:v2.1.3
⚠️ service:store-backend, env:prod (missing version)
❌ service:store-backend (missing env and version)
```

---

## Automation Recommendations

### 1. Tag Policy as Code

```yaml
# tagging-policy.yaml
required_tags:
  hosts:
    - env
    - team
  services:
    - service
    - env
    - version
  monitors:
    - service
    - team
    - priority

allowed_values:
  env: [dev, stage, prod]
  tier: [1, 2, 3, 4]
  priority: [p1, p2, p3, p4, p5]
```

### 2. CI/CD Tag Validation

```bash
# In deployment pipeline
if [ -z "$DD_ENV" ] || [ -z "$DD_SERVICE" ] || [ -z "$DD_VERSION" ]; then
  echo "Error: UST tags required for deployment"
  exit 1
fi
```

### 3. Regular Audits

```bash
# Weekly tagging audit
0 9 * * MON /path/to/run-tagging-audit.sh

# Monthly compliance report
0 9 1 * * /path/to/generate-tagging-report.sh
```

---

## Output Formats

### Summary View (for executives):

```
Tagging Compliance: 78/100 (Good)
- Infrastructure: 85% compliant
- Services: 72% compliant (needs version tags)
- Monitors: 68% compliant (needs team tags)

Top Actions:
1. Add team tags to 45 monitors
2. Implement UST for 4 services
3. Fix 12 tag format violations
```

### Detailed View (for implementation):

```
[Complete analysis with all sections from Steps 1-6]

Including:
- Resource-by-resource breakdown
- Specific tag gaps per resource
- Exact commands/configs to fix
- Priority and timeline
```

---

## Success Criteria

After implementing recommendations:

- Infrastructure tag coverage >90%
- UST compliance >85%
- Monitor routing tags >90%
- Tag format violations: 0
- Compliance score >85

---

**This skill enables comprehensive tagging strategy analysis and compliance tracking using your MCP tools!** 🏷️✨
