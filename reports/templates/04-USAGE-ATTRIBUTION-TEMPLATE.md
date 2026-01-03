# Datadog Usage Attribution Strategy

**Date**: {{ASSESSMENT_DATE}}
**Analysis Period**: Past {{ANALYSIS_DAYS}} days
**Current Attribution Status**: {{ATTRIBUTION_STATUS}}
**Resources Analyzed**: {{TOTAL_HOSTS}} Hosts, {{TOTAL_SERVICES}} Services, {{TOTAL_MONITORS}} Monitors, {{TOTAL_DASHBOARDS}} Dashboards

---

## Executive Summary

**Current State**: {{CURRENT_ATTRIBUTION_STATE}}
**Impact**: {{ATTRIBUTION_IMPACT}}

### Recommended Attribution Tags (Top 3):

**🏆 RECOMMENDED: `{{TAG1}}`, `{{TAG2}}`, `{{TAG3}}`**

**Expected Benefits**:
{{#ATTRIBUTION_BENEFITS}}

- {{BENEFIT_TEXT}}
  {{/ATTRIBUTION_BENEFITS}}

**Prerequisites** (Before Enabling):
{{#PREREQUISITES}}
{{PREREQ_NUMBER}}. {{PREREQ_EMOJI}} {{PREREQ_TEXT}}
{{/PREREQUISITES}}

**Estimated Time to Ready**: {{READINESS_TIMELINE}}

---

## Current Tag Usage Analysis

### Tag Coverage Across Resources:

| Tag Key | Hosts | Monitors | Services | Avg Coverage | Cardinality | Score | Status |
| ------- | ----- | -------- | -------- | ------------ | ----------- | ----- | ------ |

{{#TAG_ANALYSIS}}
| **{{TAG_NAME}}** | {{HOST_COVERAGE}}% | {{MONITOR_COVERAGE}}% | {{SERVICE_COVERAGE}}% | **{{AVG_COVERAGE}}%** | {{CARDINALITY}} {{CARDINALITY_STATUS}} | **{{SCORE}}/100** | {{STATUS}} |
{{/TAG_ANALYSIS}}

---

## Estimated Usage Distribution

### By Team (Estimated from Resource Counts):

| Team | Est. Hosts | Est. Monitors | Est. Services | Est. Cost % | Status |
| ---- | ---------- | ------------- | ------------- | ----------- | ------ |

{{#TEAM_DISTRIBUTION}}
| {{TEAM_NAME}} | {{HOST_COUNT}} ({{HOST_PCT}}%) | {{MONITOR_COUNT}} ({{MONITOR_PCT}}%) | {{SERVICE_COUNT}} | **{{COST_PCT}}%** | {{STATUS}} |
{{/TEAM_DISTRIBUTION}}

**KEY FINDING**: ~{{UNATTRIBUTED_PCT}}% of costs are UNATTRIBUTED due to missing team tags!

### By Environment (Estimated):

| Environment | Est. Hosts | Est. Monitors | Est. Cost % | Industry Benchmark |
| ----------- | ---------- | ------------- | ----------- | ------------------ |

{{#ENV_DISTRIBUTION}}
| {{ENV_NAME}} | {{HOST_COUNT}} ({{HOST_PCT}}%) | {{MONITOR_COUNT}} ({{MONITOR_PCT}}%) | **{{COST_PCT}}%** | {{BENCHMARK}}% {{BENCHMARK_STATUS}} |
{{/ENV_DISTRIBUTION}}

### By Service (from APM/Logs):

| Service | Type | Priority | Est. Cost % | Cost Drivers |
| ------- | ---- | -------- | ----------- | ------------ |

{{#SERVICE_DISTRIBUTION}}
| {{SERVICE_NAME}} | {{SERVICE_TYPE}} | {{PRIORITY}} | **{{COST_PCT}}%** | {{COST_DRIVERS}} |
{{/SERVICE_DISTRIBUTION}}

---

## RECOMMENDED ATTRIBUTION TAGS

### **Tag #1: {{TAG1}}** (Score: {{TAG1_SCORE}}/100)

- **Coverage**: {{TAG1_COVERAGE}}% → Target: {{TAG1_TARGET}}%
- **Cardinality**: {{TAG1_CARDINALITY}} {{TAG1_CARDINALITY_ASSESSMENT}}
- **Business Value**: {{TAG1_BUSINESS_VALUE}}
- **Actionability**: {{TAG1_ACTIONABILITY}}
- **Current Gap**: {{TAG1_GAP}}
- **Effort to Fix**: {{TAG1_EFFORT}}

### **Tag #2: {{TAG2}}** (Score: {{TAG2_SCORE}}/100)

- **Coverage**: {{TAG2_COVERAGE}}% → Target: {{TAG2_TARGET}}%
- **Cardinality**: {{TAG2_CARDINALITY}} {{TAG2_CARDINALITY_ASSESSMENT}}
- **Business Value**: {{TAG2_BUSINESS_VALUE}}
- **Actionability**: {{TAG2_ACTIONABILITY}}
- **Current Gap**: {{TAG2_GAP}}
- **Effort to Fix**: {{TAG2_EFFORT}}

### **Tag #3: {{TAG3}}** (Score: {{TAG3_SCORE}}/100)

- **Coverage**: {{TAG3_COVERAGE}}% → Target: {{TAG3_TARGET}}%
- **Cardinality**: {{TAG3_CARDINALITY}} {{TAG3_CARDINALITY_ASSESSMENT}}
- **Business Value**: {{TAG3_BUSINESS_VALUE}}
- **Current Gap**: {{TAG3_GAP}}
- **Effort to Fix**: {{TAG3_EFFORT}}

---

## COST OPTIMIZATION OPPORTUNITIES

### Total Estimated Monthly Savings: ${{SAVINGS_MIN}}-{{SAVINGS_MAX}}

{{#OPTIMIZATION_OPPORTUNITIES}}

#### **Opportunity #{{OPP_NUMBER}}: {{OPP_TITLE}}** {{OPP_PRIORITY}}

**Finding**: {{OPP_FINDING}}
**Potential Action**: {{OPP_ACTION}}
**Estimated Savings**: {{OPP_SAVINGS}}
**Risk**: {{OPP_RISK}}
{{/OPTIMIZATION_OPPORTUNITIES}}

---

## IMPLEMENTATION ROADMAP

### **Phase 1: Preparation** (Week 1)

{{#PHASE1_TASKS}}

- [ ] {{TASK_TEXT}}
      {{/PHASE1_TASKS}}

### **Phase 2: Enable Attribution** (Week 2)

{{#PHASE2_TASKS}}

- [ ] {{TASK_TEXT}}
      {{/PHASE2_TASKS}}

### **Phase 3: Dashboards & Monitoring** (Week 3)

{{#PHASE3_TASKS}}

- [ ] {{TASK_TEXT}}
      {{/PHASE3_TASKS}}

### **Phase 4: Optimization** (Week 4+)

{{#PHASE4_TASKS}}

- [ ] {{TASK_TEXT}}
      {{/PHASE4_TASKS}}

---

## EXPECTED OUTCOMES

### **After Phase 1** (Week 1):

{{#PHASE1_OUTCOMES}}

- ✅ {{OUTCOME_TEXT}}
  {{/PHASE1_OUTCOMES}}

### **After Phase 2** (Week 2):

{{#PHASE2_OUTCOMES}}

- ✅ {{OUTCOME_TEXT}}
  {{/PHASE2_OUTCOMES}}

### **After Phase 4** (Month 2+):

{{#PHASE4_OUTCOMES}}

- ✅ {{OUTCOME_TEXT}}
  {{/PHASE4_OUTCOMES}}

---

## ROI CALCULATION

### **Investment**:

- **Time**: {{INVESTMENT_DAYS}} days engineering effort
- **Cost**: ~${{INVESTMENT_COST}}

### **Return**:

- **Year 1 Savings**: ${{YEAR1_SAVINGS_MIN}}-{{YEAR1_SAVINGS_MAX}}
- **Efficiency Gains**: ${{EFFICIENCY_GAINS}}/year
- **Total Year 1**: ${{YEAR1_TOTAL_MIN}}-{{YEAR1_TOTAL_MAX}}
- **ROI**: {{ROI_MIN}}-{{ROI_MAX}}%

---

## SUMMARY

**Recommended Tags**: `{{TAG1}}`, `{{TAG2}}`, `{{TAG3}}`
**Readiness**: {{READINESS_SCORE}}/100
**Timeline**: {{IMPLEMENTATION_WEEKS}} weeks
**Expected Benefits**: {{EXPECTED_BENEFITS}}
**Investment**: {{INVESTMENT_SUMMARY}}
**ROI**: {{ROI_SUMMARY}}

---

✅ **Usage Attribution Analysis Complete!**

_Recommendation: {{RECOMMENDATION_TEXT}}_
_Expected outcome: {{EXPECTED_OUTCOME}}_
_Next action: {{NEXT_ACTION}}_
