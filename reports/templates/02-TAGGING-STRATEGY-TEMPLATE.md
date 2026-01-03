# Datadog Tagging Compliance Report

**Date**: {{ASSESSMENT_DATE}}
**Resources Analyzed**: {{TOTAL_HOSTS}} Hosts, {{TOTAL_SERVICES}} Services, {{TOTAL_MONITORS}} Monitors, {{TOTAL_DASHBOARDS}} Dashboards
**Overall Compliance Score**: {{TAGGING_SCORE}}/100 - {{COMPLIANCE_STATUS}}

---

## Executive Summary

Your tagging strategy {{COMPLIANCE_ASSESSMENT}}.

**Key Findings**:
{{#KEY_FINDINGS}}

- {{FINDING_EMOJI}} **{{FINDING_TITLE}}**: {{FINDING_DESCRIPTION}}
  {{/KEY_FINDINGS}}

**Impact**:
{{#IMPACTS}}

- {{IMPACT_EMOJI}} {{IMPACT_TEXT}}
  {{/IMPACTS}}

---

## Compliance by Category

| Resource Type      | Score                      | Compliance %              | Target %              | Gap                | Status                 |
| ------------------ | -------------------------- | ------------------------- | --------------------- | ------------------ | ---------------------- |
| **Infrastructure** | {{INFRA_TAG_SCORE}}/40     | {{INFRA_COMPLIANCE}}%     | {{INFRA_TARGET}}%     | {{INFRA_GAP}}%     | {{INFRA_STATUS}}       |
| **Monitors**       | {{MONITOR_TAG_SCORE}}/30   | {{MONITOR_COMPLIANCE}}%   | {{MONITOR_TARGET}}%   | {{MONITOR_GAP}}%   | {{MONITOR_STATUS}}     |
| **Services (APM)** | {{SERVICE_TAG_SCORE}}/30   | {{SERVICE_COMPLIANCE}}%   | {{SERVICE_TARGET}}%   | {{SERVICE_GAP}}%   | {{SERVICE_STATUS}}     |
| **Logs**           | {{LOG_TAG_SCORE}}/20       | {{LOG_COMPLIANCE}}%       | {{LOG_TARGET}}%       | {{LOG_GAP}}%       | {{LOG_STATUS}}         |
| **Dashboards**     | {{DASHBOARD_TAG_SCORE}}/10 | {{DASHBOARD_COMPLIANCE}}% | {{DASHBOARD_TARGET}}% | {{DASHBOARD_GAP}}% | {{DASHBOARD_STATUS}}   |
| **TOTAL**          | **{{TAGGING_SCORE}}/100**  | -                         | -                     | -                  | **{{OVERALL_STATUS}}** |

---

## DETAILED FINDINGS

### 1. Infrastructure Tagging: {{INFRA_TAG_SCORE}}/40

**Total Hosts**: {{TOTAL_HOSTS}}

#### Reserved Tags Coverage:

- **host**: {{HOST_TAG_PCT}}% {{HOST_TAG_STATUS}} ({{HOST_TAG_NOTE}})
- **env**: {{ENV_TAG_PCT}}% {{ENV_TAG_STATUS}} (target: >95%)
  - Gap: {{ENV_TAG_GAP}} hosts missing env tags
  - Impact: {{ENV_TAG_IMPACT}}

#### Critical Tags Coverage:

- **team**: {{TEAM_TAG_PCT}}% {{TEAM_TAG_STATUS}} (target: >85%)
  - Gap: {{TEAM_TAG_GAP}} hosts need team tags
  - Impact: {{TEAM_TAG_IMPACT}}

**Score Breakdown**:

- Reserved tags (host, env): {{RESERVED_TAG_SUBSCORE}}/20 pts
- Critical tags (team): {{CRITICAL_TAG_SUBSCORE}}/15 pts
- Recommended tags: {{RECOMMENDED_TAG_SUBSCORE}}/5 pts

**Priority Actions**:
{{#INFRA_PRIORITY_ACTIONS}}
{{ACTION_NUMBER}}. {{ACTION_TEXT}}
{{/INFRA_PRIORITY_ACTIONS}}

---

### 2. Monitor Tagging: {{MONITOR_TAG_SCORE}}/30

**Total Monitors**: {{TOTAL_MONITORS}}

#### Critical Tags (for alert routing):

- **team**: {{MONITOR_TEAM_PCT}}% ({{MONITORS_WITH_TEAM}}/{{TOTAL_MONITORS}}) {{MONITOR_TEAM_STATUS}}
  {{#TEAMS_FOUND}}

  - ✅ {{TEAM_NAME}} ({{TEAM_MONITOR_COUNT}} monitors)
    {{/TEAMS_FOUND}}
  - ❌ **{{MONITORS_WITHOUT_TEAM}} monitors WITHOUT team tags**

- **priority**: {{MONITOR_PRIORITY_PCT}}% ({{MONITORS_WITH_PRIORITY}}/{{TOTAL_MONITORS}}) {{MONITOR_PRIORITY_STATUS}}
  - {{PRIORITY_ISSUE}}

#### Monitors Missing Critical Tags:

**High Priority** (Fix Immediately):
{{#MONITORS_MISSING_TAGS}}
{{MONITOR_NUMBER}}. "{{MONITOR_NAME}}" ({{MONITOR_ID}}) - Missing: {{MISSING_TAGS}}
{{/MONITORS_MISSING_TAGS}}

**Score Breakdown**:

- Required tags (service, env): {{MONITOR_REQUIRED_SUBSCORE}}/10 pts
- Critical tags (team, priority): {{MONITOR_CRITICAL_SUBSCORE}}/20 pts
  Total: {{MONITOR_TAG_SCORE}}/30 pts

**Impact**:
{{#MONITOR_IMPACTS}}

- {{IMPACT_EMOJI}} {{IMPACT_TEXT}}
  {{/MONITOR_IMPACTS}}

---

### 3. APM Service Tagging: {{SERVICE_TAG_SCORE}}/30

**Services Discovered**: {{TOTAL_SERVICES}}

#### Unified Service Tagging (UST) Compliance:

- **service** tag: {{SERVICE_NAME_PCT}}% ✅
- **env** tag: {{SERVICE_ENV_PCT}}% {{SERVICE_ENV_STATUS}}
- **version** tag: {{SERVICE_VERSION_PCT}}% {{SERVICE_VERSION_STATUS}}

**UST Status** (service + env + version):

- Complete UST: {{UST_COMPLETE_COUNT}}/{{TOTAL_SERVICES}} ({{UST_COMPLETE_PCT}}%)
- Partial UST: {{UST_PARTIAL_COUNT}}/{{TOTAL_SERVICES}} ({{UST_PARTIAL_PCT}}%)
- Minimal: {{UST_MINIMAL_COUNT}}/{{TOTAL_SERVICES}} ({{UST_MINIMAL_PCT}}%)

**Services Needing Tags**:
{{#SERVICES_NEED_TAGS}}
{{SERVICE_NUMBER}}. **{{SERVICE_NAME}}**: {{MISSING_TAGS}}
{{/SERVICES_NEED_TAGS}}

**Score Breakdown**:

- UST complete: {{UST_SUBSCORE}}/20 pts
- Additional tags: {{ADDITIONAL_TAG_SUBSCORE}}/10 pts
  Total: {{SERVICE_TAG_SCORE}}/30 pts

---

## PRIORITY ACTION ITEMS

### 🔴 CRITICAL Priority (Implement This Week)

{{#CRITICAL_TAG_ACTIONS}}
**{{ACTION_NUMBER}}. {{ACTION_TITLE}}** {{ACTION_EMOJI}} **{{ACTION_URGENCY}}**

- **Impact**: {{ACTION_IMPACT}}
- **Effort**: {{ACTION_EFFORT}}
- **How**: {{ACTION_STEPS}}
  {{/CRITICAL_TAG_ACTIONS}}

### 🟡 HIGH Priority (Implement This Month)

{{#HIGH_TAG_ACTIONS}}
**{{ACTION_NUMBER}}. {{ACTION_TITLE}}**

- **Action**: {{ACTION_DESCRIPTION}}
- **Effort**: {{ACTION_EFFORT}}
- **Impact**: {{ACTION_IMPACT}}
  {{/HIGH_TAG_ACTIONS}}

---

## IMPLEMENTATION GUIDE

### Quick Win #1: Add Team Tags to Monitors

**Step-by-Step**:

1. Go to Datadog UI → Monitors → Manage Monitors
2. Filter by integration or type
3. Select monitors
4. Bulk Actions → Edit Tags
5. Add: `team:{{TEAM_NAME}}`
6. Save

**Teams to assign**:
{{#TEAMS_TO_ASSIGN}}

- {{INTEGRATION_TYPE}} monitors → {{TEAM_TAG}}
  {{/TEAMS_TO_ASSIGN}}

---

## SUCCESS METRICS

**After Implementation** (Target: {{IMPLEMENTATION_MONTHS}} months):
{{#SUCCESS_METRICS}}

- ✅ {{METRIC_NAME}}: {{METRIC_CURRENT}} → {{METRIC_TARGET}}
  {{/SUCCESS_METRICS}}

---

## COST IMPACT

**After Tagging**:
{{#COST_BENEFITS}}

- ✅ {{BENEFIT_TEXT}}: {{BENEFIT_VALUE}}
  {{/COST_BENEFITS}}

**Estimated Value**: {{ANNUAL_VALUE_TEXT}}

---

**✅ Tagging Strategy Analysis Complete!**

_Report generated by Datadog MCP Tagging Strategy Skill_
_Compliance Score: {{TAGGING_SCORE}}/100_
