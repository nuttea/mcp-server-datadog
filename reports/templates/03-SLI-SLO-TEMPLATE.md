# SLI/SLO Analysis Report

**Date**: {{ASSESSMENT_DATE}}
**Services Analyzed**: {{TOTAL_SERVICES}}
**Existing SLOs**: {{TOTAL_SLOS}}
**Coverage**: {{SLO_COVERAGE_PCT}}% (target: >75%)
**Overall Score**: {{SLO_SCORE}}/100

---

## Executive Summary

{{#IF_NO_SLOS}}
**CRITICAL GAPS IDENTIFIED**:

1. ❌ **Zero SLOs Defined** - No reliability targets for any service
2. ❌ **{{APM_DATA_STATUS}}** - {{APM_DATA_DESCRIPTION}}
3. ❌ **Flying Blind** - Cannot track error budgets or service health

**Impact**:
{{#IMPACTS}}

- {{IMPACT_TEXT}}
  {{/IMPACTS}}
  {{/IF_NO_SLOS}}

{{#IF_HAS_SLOS}}
**Current State**:

- {{SLOS_EXIST_COUNT}} services have SLOs ({{SLO_COVERAGE_PCT}}% coverage)
- {{SLOS_MISSING_COUNT}} services need SLOs
- {{SLOS_AT_RISK_COUNT}} services have performance issues
  {{/IF_HAS_SLOS}}

---

## Service Inventory & SLO Gap Analysis

### Services Discovered: {{TOTAL_SERVICES}}

#### **Tier 1: Critical User-Facing Services** (Needs SLOs URGENTLY)

{{#TIER1_SERVICES}}
**{{SERVICE_NUMBER}}. {{SERVICE_NAME}}** {{PRIORITY_EMOJI}} {{PRIORITY_LEVEL}}

- **Type**: {{SERVICE_TYPE}}
- **Criticality**: {{SERVICE_CRITICALITY}}
- **APM Status**: {{APM_STATUS}}
- **Current SLOs**: {{CURRENT_SLOS}}
- **Recommended SLOs**:
  - Availability: {{RECOMMENDED_AVAILABILITY}}% (30-day)
  - Latency P95: <{{RECOMMENDED_P95_MS}}ms
  - Latency P99: <{{RECOMMENDED_P99_MS}}ms
- **Action**: {{REQUIRED_ACTION}}
  {{/TIER1_SERVICES}}

#### **Tier 2: Infrastructure Services** (Lower Priority)

{{#TIER2_SERVICES}}
**{{SERVICE_NUMBER}}. {{SERVICE_NAME}}** {{PRIORITY_EMOJI}} {{PRIORITY_LEVEL}}

- **Type**: {{SERVICE_TYPE}}
- **Criticality**: {{SERVICE_CRITICALITY}}
- **SLO Priority**: {{SLO_PRIORITY}}
  {{/TIER2_SERVICES}}

---

## {{#IF_NO_APM_DATA}}Critical Finding: Missing APM Data{{/IF_NO_APM_DATA}}

{{#IF_NO_APM_DATA}}

### What We Found:

When querying APM statistics for critical services, **no performance data was returned**.

### Possible Causes:

1. **APM Not Instrumented** ❌
   - Services don't have Datadog APM tracer installed
2. **APM Not Configured** ⚠️
   - Tracer installed but not sending data
3. **No Recent Traffic** ⚠️
   - Services not receiving requests
4. **Infrastructure Services Only** ℹ️
   - Some services don't need APM (coredns, agent)

### Required Actions:

**IMMEDIATE** (This Week):

1. Verify APM instrumentation status
2. Instrument critical services (see code examples below)
3. Verify data flow to Datadog
   {{/IF_NO_APM_DATA}}

---

## Recommended SLO Definitions

### Priority 1: {{TOP_SERVICE_NAME}}

**Availability SLO**:

```yaml
name: '{{TOP_SERVICE_NAME}} - Availability'
type: metric
thresholds:
  - target: { { AVAILABILITY_TARGET } }
    timeframe: 30d
    warning: { { AVAILABILITY_WARNING } }
query:
  numerator: 'sum:trace.{{TOP_SERVICE_NAME}}.request.hits{!error:true}.as_count()'
  denominator: 'sum:trace.{{TOP_SERVICE_NAME}}.request.hits{*}.as_count()'
tags:
  - service:{{TOP_SERVICE_NAME}}
  - tier:{{SERVICE_TIER}}
  - team:{{SERVICE_TEAM}}
```

**Latency SLO (P95)**:

```yaml
name: '{{TOP_SERVICE_NAME}} - Latency P95'
thresholds:
  - target: 95
    timeframe: 30d
query:
  numerator: 'sum:trace.{{TOP_SERVICE_NAME}}.request.duration{p95 < {{P95_THRESHOLD_MS}}ms}.as_count()'
  denominator: 'sum:trace.{{TOP_SERVICE_NAME}}.request.duration{*}.as_count()'
```

---

## SLO Priority Matrix

| Service | Traffic | Criticality | User Impact | SLO Priority | Target Availability |
| ------- | ------- | ----------- | ----------- | ------------ | ------------------- |

{{#SLO_PRIORITY_MATRIX}}
| {{SERVICE_NAME}} | {{TRAFFIC_LEVEL}} | {{CRITICALITY}} | {{USER_IMPACT}} | {{PRIORITY_EMOJI}} {{PRIORITY}} | {{TARGET_AVAILABILITY}}% |
{{/SLO_PRIORITY_MATRIX}}

---

## Implementation Roadmap

### **Week 1: APM Instrumentation** 🔴

{{#WEEK1_TASKS}}

- [ ] {{TASK_TEXT}}
      {{/WEEK1_TASKS}}

### **Week 2: Baseline Performance** 📊

{{#WEEK2_TASKS}}

- [ ] {{TASK_TEXT}}
      {{/WEEK2_TASKS}}

### **Week 3: SLO Definition** 🎯

{{#WEEK3_TASKS}}

- [ ] {{TASK_TEXT}}
      {{/WEEK3_TASKS}}

### **Week 4: Monitoring & Refinement** 🔍

{{#WEEK4_TASKS}}

- [ ] {{TASK_TEXT}}
      {{/WEEK4_TASKS}}

---

## Expected Outcomes

### **After Week 1** (APM Instrumentation):

{{#WEEK1_OUTCOMES}}

- ✅ {{OUTCOME_TEXT}}
  {{/WEEK1_OUTCOMES}}

### **After Week 3** (SLOs Defined):

{{#WEEK3_OUTCOMES}}

- ✅ {{OUTCOME_TEXT}}
  {{/WEEK3_OUTCOMES}}

### **After Month 2** (Full Coverage):

{{#MONTH2_OUTCOMES}}

- ✅ {{OUTCOME_TEXT}}
  {{/MONTH2_OUTCOMES}}

---

## Scoring Breakdown

| Category                  | Score                         | Notes                  |
| ------------------------- | ----------------------------- | ---------------------- |
| **Existing SLO Coverage** | {{SLO_COVERAGE_SUBSCORE}}/40  | {{SLO_COVERAGE_NOTE}}  |
| **APM Instrumentation**   | {{APM_SUBSCORE}}/30           | {{APM_NOTE}}           |
| **Error Budget Tracking** | {{ERROR_BUDGET_SUBSCORE}}/20  | {{ERROR_BUDGET_NOTE}}  |
| **Documentation**         | {{DOCUMENTATION_SUBSCORE}}/10 | {{DOCUMENTATION_NOTE}} |
| **TOTAL**                 | **{{SLO_SCORE}}/100**         | {{OVERALL_NOTE}}       |

---

## Next Steps

### **IMMEDIATE** (This Week):

{{#IMMEDIATE_STEPS}}
{{STEP_NUMBER}}. 🔴 **{{STEP_TITLE}}**
{{/IMMEDIATE_STEPS}}

### **SHORT-TERM** (This Month):

{{#SHORTTERM_STEPS}}
{{STEP_NUMBER}}. 🟡 **{{STEP_TITLE}}**
{{/SHORTTERM_STEPS}}

### **LONG-TERM** (Next Quarter):

{{#LONGTERM_STEPS}}
{{STEP_NUMBER}}. 🟢 **{{STEP_TITLE}}**
{{/LONGTERM_STEPS}}

---

✅ **SLI/SLO Analysis Complete!**

_Score: {{SLO_SCORE}}/100_
_Next Step: {{NEXT_STEP_TEXT}}_
