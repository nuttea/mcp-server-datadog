# Datadog Maturity Assessment - Action Items Tracker

**Assessment Date**: {{ASSESSMENT_DATE}}
**Status**: {{OVERALL_STATUS}}
**Target Completion**: {{TARGET_DATE}} ({{TIMELINE_DAYS}} days)

---

## Progress Dashboard

| Phase                           | Status            | Target Date     | Completion             |
| ------------------------------- | ----------------- | --------------- | ---------------------- |
| **Week 1: Critical Actions**    | {{WEEK1_STATUS}}  | {{WEEK1_DATE}}  | {{WEEK1_COMPLETION}}%  |
| **Month 1: Foundation**         | {{MONTH1_STATUS}} | {{MONTH1_DATE}} | {{MONTH1_COMPLETION}}% |
| **Month 2: Quality & Coverage** | {{MONTH2_STATUS}} | {{MONTH2_DATE}} | {{MONTH2_COMPLETION}}% |
| **Month 3: Optimization**       | {{MONTH3_STATUS}} | {{MONTH3_DATE}} | {{MONTH3_COMPLETION}}% |

**Overall Progress**: {{TOTAL_COMPLETE}}/{{TOTAL_ACTIONS}} critical actions complete

---

## 🔴 CRITICAL PRIORITY (This Week)

{{#CRITICAL_ACTIONS}}

### {{ACTION_NUMBER}}. {{ACTION_TITLE}} {{STATUS_EMOJI}}

**Owner**: {{OWNER_NAME}}
**Due**: {{DUE_DATE}}
**Status**: {{STATUS}}

**Sub-tasks**:
{{#SUB_TASKS}}

- [ ] {{SUBTASK_TEXT}}
      {{/SUB_TASKS}}

**Effort**: {{EFFORT_ESTIMATE}}
**Impact**: {{IMPACT_RATING}} ({{IMPACT_DESCRIPTION}})
**Blockers**: {{BLOCKERS}}
**Notes**: {{NOTES}}

---

{{/CRITICAL_ACTIONS}}

## 🟡 HIGH PRIORITY (This Month)

{{#HIGH_ACTIONS}}

### {{ACTION_NUMBER}}. {{ACTION_TITLE}} {{STATUS_EMOJI}}

**Owner**: {{OWNER_NAME}}
**Due**: {{DUE_DATE}}
**Status**: {{STATUS}}

**Sub-tasks**:
{{#SUB_TASKS}}

- [ ] {{SUBTASK_TEXT}}
      {{/SUB_TASKS}}

**Effort**: {{EFFORT_ESTIMATE}}
**Impact**: {{IMPACT_RATING}} ({{IMPACT_DESCRIPTION}})
**Blockers**: {{BLOCKERS}}

---

{{/HIGH_ACTIONS}}

## 🟢 MEDIUM PRIORITY (Next Quarter)

{{#MEDIUM_ACTIONS}}

### {{ACTION_NUMBER}}. {{ACTION_TITLE}} {{STATUS_EMOJI}}

**Owner**: {{OWNER_NAME}}
**Due**: {{DUE_DATE}}
**Status**: {{STATUS}}

**Sub-tasks**:
{{#SUB_TASKS}}

- [ ] {{SUBTASK_TEXT}}
      {{/SUB_TASKS}}

**Effort**: {{EFFORT_ESTIMATE}}
**Impact**: {{IMPACT_RATING}}

---

{{/MEDIUM_ACTIONS}}

---

## Milestones

### Month 1: Foundation (Target: {{MONTH1_DATE}})

{{#MONTH1_MILESTONES}}

- [ ] {{MILESTONE_TEXT}}
      {{/MONTH1_MILESTONES}}
- **Target Score**: {{MONTH1_SCORE_TARGET}}/100 (Level {{MONTH1_LEVEL}})

### Month 2: Quality (Target: {{MONTH2_DATE}})

{{#MONTH2_MILESTONES}}

- [ ] {{MILESTONE_TEXT}}
      {{/MONTH2_MILESTONES}}
- **Target Score**: {{MONTH2_SCORE_TARGET}}/100 (Level {{MONTH2_LEVEL}})

### Month 3: Optimization (Target: {{MONTH3_DATE}})

{{#MONTH3_MILESTONES}}

- [ ] {{MILESTONE_TEXT}}
      {{/MONTH3_MILESTONES}}
- **Target Score**: {{MONTH3_SCORE_TARGET}}/100 (Level {{MONTH3_LEVEL}})

---

## Risk Log

| Risk | Impact | Probability | Mitigation | Owner |
| ---- | ------ | ----------- | ---------- | ----- |

{{#RISKS}}
| {{RISK_TEXT}} | {{RISK_IMPACT}} | {{RISK_PROBABILITY}} | {{RISK_MITIGATION}} | {{RISK_OWNER}} |
{{/RISKS}}

---

## Change Log

| Date | Action | Status | Notes |
| ---- | ------ | ------ | ----- |

{{#CHANGES}}
| {{CHANGE_DATE}} | {{CHANGE_ACTION}} | {{CHANGE_STATUS}} | {{CHANGE_NOTES}} |
{{/CHANGES}}

---

## Next Review: {{NEXT_REVIEW_DATE}}

**Actions for Next Review**:
{{#REVIEW_ACTIONS}}
{{ACTION_NUMBER}}. {{ACTION_TEXT}}
{{/REVIEW_ACTIONS}}

---

**Last Updated**: {{LAST_UPDATED}}
**Status**: {{CURRENT_STATUS}}
**Owner**: {{PROGRAM_OWNER}}
