# Datadog Account Health Check Report

**Date**: {{ASSESSMENT_DATE}}
**Period**: Past {{ANALYSIS_DAYS}} days
**Overall Score**: {{HEALTH_SCORE}}/100 - {{HEALTH_STATUS}}

---

## Executive Summary

Your Datadog account health is {{HEALTH_STATUS_TEXT}}.

**Key Highlights**:
{{#HIGHLIGHTS}}

- {{EMOJI}} {{HIGHLIGHT_TEXT}}
  {{/HIGHLIGHTS}}

---

## Detailed Scores

| Category               | Score                    | Status               | Key Issue             |
| ---------------------- | ------------------------ | -------------------- | --------------------- |
| **Infrastructure**     | {{INFRA_SCORE}}/25       | {{INFRA_STATUS}}     | {{INFRA_ISSUE}}       |
| **Monitors**           | {{MONITOR_SCORE}}/25     | {{MONITOR_STATUS}}   | {{MONITOR_ISSUE}}     |
| **Logs**               | {{LOG_SCORE}}/20         | {{LOG_STATUS}}       | {{LOG_ISSUE}}         |
| **SLOs & Performance** | {{SLO_SCORE}}/20         | {{SLO_STATUS}}       | {{SLO_ISSUE}}         |
| **Dashboards**         | {{DASHBOARD_SCORE}}/10   | {{DASHBOARD_STATUS}} | {{DASHBOARD_ISSUE}}   |
| **TOTAL**              | **{{HEALTH_SCORE}}/100** | {{OVERALL_STATUS}}   | **{{OVERALL_ISSUE}}** |

---

## Detailed Findings

### 1. Infrastructure Health: {{INFRA_SCORE}}/25

**What We Found**:

- **Total Hosts**: {{TOTAL_HOSTS}} ({{ACTIVE_HOSTS}} active)
- **Agent Coverage**: {{AGENT_COVERAGE_PCT}}% ({{HOSTS_WITH_AGENT}}/{{TOTAL_HOSTS}})
- **Tag Coverage**: {{TAG_COVERAGE_PCT}}%

**Issues**:
{{#INFRA_ISSUES}}

- {{ISSUE_TEXT}}
  {{/INFRA_ISSUES}}

**Score Breakdown**:

- Agent coverage ({{AGENT_SUBSCORE}}/10): {{AGENT_STATUS}}
- Env tag coverage ({{ENV_TAG_SUBSCORE}}/8): {{ENV_TAG_STATUS}}
- Team tag coverage ({{TEAM_TAG_SUBSCORE}}/7): {{TEAM_TAG_STATUS}}

---

### 2. Monitor Quality: {{MONITOR_SCORE}}/25

**What We Found**:

- **Total Monitors**: {{TOTAL_MONITORS}}
- **Status Distribution**:
  - 🟢 OK: {{MONITORS_OK}} ({{MONITORS_OK_PCT}}%)
  - 🔴 Alert: {{MONITORS_ALERT}} ({{MONITORS_ALERT_PCT}}%)
  - 🟡 Warn: {{MONITORS_WARN}} ({{MONITORS_WARN_PCT}}%)
  - ⚠️ No Data: {{MONITORS_NO_DATA}} ({{MONITORS_NO_DATA_PCT}}%)

**Critical Issues**:
{{#MONITOR_ISSUES}}
{{ISSUE_NUMBER}}. **{{ISSUE_TITLE}}**
{{ISSUE_DETAILS}}
{{/MONITOR_ISSUES}}

**Score Breakdown**:

- Alert fatigue/No Data ({{ALERT_FATIGUE_SUBSCORE}}/10): {{ALERT_FATIGUE_STATUS}}
- Priority tags ({{PRIORITY_TAG_SUBSCORE}}/10): {{PRIORITY_TAG_STATUS}}
- Coverage & routing ({{COVERAGE_SUBSCORE}}/5): {{COVERAGE_STATUS}}

---

### 3. Log Efficiency: {{LOG_SCORE}}/20

**What We Found**:

- **Services Discovered**: {{TOTAL_SERVICES}} services sending logs
- **Log Volume**: {{LOG_VOLUME_STATUS}}
- **Service List**: {{SERVICE_LIST}}

**Score Breakdown**:

- Service discovery ({{SERVICE_DISCOVERY_SUBSCORE}}/8): {{SERVICE_DISCOVERY_STATUS}}
- Pipeline efficiency ({{PIPELINE_SUBSCORE}}/7): {{PIPELINE_STATUS}}
- Cost optimization ({{LOG_COST_SUBSCORE}}/5): {{LOG_COST_STATUS}}

---

### 4. SLO & Service Performance: {{SLO_SCORE}}/20

**What We Found**:

- **Total Services**: {{TOTAL_SERVICES}}
- **Total SLOs**: {{TOTAL_SLOS}}
- **SLO Coverage**: {{SLO_COVERAGE_PCT}}% (target: 75%+)

{{#IF_NO_SLOS}}
**This Is a Critical Gap Because**:

- ❌ No reliability targets defined
- ❌ Can't track error budgets
- ❌ No data-driven decision making
- ❌ Can't prioritize incidents by business impact
  {{/IF_NO_SLOS}}

**Services Needing SLOs** (Priority Order):
{{#SERVICES_NEED_SLOS}}
{{SERVICE_NUMBER}}. **{{SERVICE_NAME}}** - {{SERVICE_DESCRIPTION}}
{{/SERVICES_NEED_SLOS}}

**Score Breakdown**:

- SLO coverage ({{SLO_COVERAGE_SUBSCORE}}/10): {{SLO_COVERAGE_STATUS}}
- Performance analysis ({{PERF_SUBSCORE}}/5): {{PERF_STATUS}}
- Error budgets ({{ERROR_BUDGET_SUBSCORE}}/5): {{ERROR_BUDGET_STATUS}}

---

### 5. Dashboard Health: {{DASHBOARD_SCORE}}/10

**What We Found**:

- **Total Dashboards**: {{TOTAL_DASHBOARDS}}
- **Dashboards**: {{DASHBOARD_LIST}}

**Score Breakdown**:

- Organization ({{DASHBOARD_ORG_SUBSCORE}}/5): {{DASHBOARD_ORG_STATUS}}
- Tag coverage ({{DASHBOARD_TAG_SUBSCORE}}/5): {{DASHBOARD_TAG_STATUS}}

---

## Priority Action Items

### 🔴 CRITICAL Priority (Fix This Week)

{{#CRITICAL_ACTIONS}}
**{{ACTION_NUMBER}}. {{ACTION_TITLE}}** {{PRIORITY_EMOJI}}

- **Action**: {{ACTION_DESCRIPTION}}
- **Why**: {{ACTION_RATIONALE}}
- **Effort**: {{ACTION_EFFORT}}
- **Impact**: {{ACTION_IMPACT}}
  {{/CRITICAL_ACTIONS}}

### 🟡 HIGH Priority (Fix This Month)

{{#HIGH_ACTIONS}}
**{{ACTION_NUMBER}}. {{ACTION_TITLE}}**

- **Action**: {{ACTION_DESCRIPTION}}
- **Effort**: {{ACTION_EFFORT}}
- **Impact**: {{ACTION_IMPACT}}
  {{/HIGH_ACTIONS}}

### 🟢 MEDIUM Priority (Fix Next Quarter)

{{#MEDIUM_ACTIONS}}
**{{ACTION_NUMBER}}. {{ACTION_TITLE}}**

- **Action**: {{ACTION_DESCRIPTION}}
- **Impact**: {{ACTION_IMPACT}}
  {{/MEDIUM_ACTIONS}}

---

## Cost Optimization Opportunities

**Estimated Total Savings**: ${{TOTAL_SAVINGS_MIN}}-{{TOTAL_SAVINGS_MAX}}/month

**Quick Wins**:
{{#QUICK_WINS}}
{{WIN_NUMBER}}. **{{WIN_TITLE}}**: {{WIN_SAVINGS}}
{{/QUICK_WINS}}

---

## Maturity Level Assessment

### Current: **Level {{CURRENT_LEVEL}}** - {{CURRENT_LEVEL_SCORE}}/100 points

**You Are Here**:
{{#CURRENT_STATE}}

- {{STATE_ITEM}}
  {{/CURRENT_STATE}}

### Path to Level {{NEXT_LEVEL}} - {{NEXT_LEVEL_TARGET}}+ points

**What You Need**:
{{#NEXT_LEVEL_REQUIREMENTS}}
{{REQ_NUMBER}}. {{REQUIREMENT}}
{{/NEXT_LEVEL_REQUIREMENTS}}

**Timeline**: {{TIMELINE_WEEKS}} weeks with focused effort

---

## Next Steps

### This Week:

{{#THIS_WEEK}}
{{STEP_NUMBER}}. {{STEP_EMOJI}} {{STEP_DESCRIPTION}}
{{/THIS_WEEK}}

### This Month:

{{#THIS_MONTH}}
{{STEP_NUMBER}}. {{STEP_EMOJI}} {{STEP_DESCRIPTION}}
{{/THIS_MONTH}}

### This Quarter:

{{#THIS_QUARTER}}
{{STEP_NUMBER}}. {{STEP_EMOJI}} {{STEP_DESCRIPTION}}
{{/THIS_QUARTER}}

---

**✅ Health Check Complete!**

_Report generated by Datadog MCP Health Check Skill_
_MCP Tools Used: {{TOOLS_USED}}_
