# Datadog Assessment Report Templates

**Purpose**: Standardized templates for generating Datadog maturity assessment reports

**Version**: 1.0
**Created**: 2026-01-03
**Based On**: Bangchak assessment (2026-01-02)

---

## 📁 Available Templates

| Template              | File                             | Purpose                   | Variables |
| --------------------- | -------------------------------- | ------------------------- | --------- |
| **Executive Summary** | 00-EXECUTIVE-SUMMARY-TEMPLATE.md | Leadership overview       | 30+       |
| **Health Check**      | 01-HEALTH-CHECK-TEMPLATE.md      | Infrastructure & monitors | 50+       |
| **Tagging Strategy**  | 02-TAGGING-STRATEGY-TEMPLATE.md  | Tag compliance audit      | 60+       |
| **SLI/SLO Analysis**  | 03-SLI-SLO-TEMPLATE.md           | Service performance       | 45+       |
| **Usage Attribution** | 04-USAGE-ATTRIBUTION-TEMPLATE.md | Cost allocation           | 40+       |
| **Action Items**      | 07-ACTION-ITEMS-TEMPLATE.md      | Implementation tracker    | 35+       |

**Total**: 6 comprehensive templates

---

## 🎯 How to Use Templates

### Method 1: Variable Substitution

**Step 1**: Copy template to new assessment directory

```bash
cp reports/templates/00-EXECUTIVE-SUMMARY-TEMPLATE.md \
   reports/datadog-assessment-YYYY-MM-DD/00-EXECUTIVE-SUMMARY.md
```

**Step 2**: Replace variables

```bash
# Replace {{VARIABLE}} with actual values
sed -i '' 's/{{ASSESSMENT_DATE}}/2026-01-02/g' 00-EXECUTIVE-SUMMARY.md
sed -i '' 's/{{OVERALL_SCORE}}/37/g' 00-EXECUTIVE-SUMMARY.md
# ... etc
```

**Step 3**: Review and publish

---

### Method 2: Programmatic Generation (Recommended)

Create a script that fills templates automatically:

```typescript
// generate-report.ts
import * as fs from 'fs'
import * as Mustache from 'mustache'

const template = fs.readFileSync(
  './templates/00-EXECUTIVE-SUMMARY-TEMPLATE.md',
  'utf-8',
)

const data = {
  ASSESSMENT_DATE: '2026-01-02',
  ACCOUNT_NAME: 'Bangchak Production',
  OVERALL_SCORE: 37,
  MATURITY_LEVEL: 'Level 1-2 (Basic → Developing)',
  STATUS_EMOJI: '⚠️',
  STATUS_TEXT: 'ACTION REQUIRED',
  STRENGTHS: [
    '100% agent deployment across 52 hosts',
    'Active monitoring with 45 monitors',
    // ...
  ],
  // ... more variables
}

const output = Mustache.render(template, data)
fs.writeFileSync('./00-EXECUTIVE-SUMMARY.md', output)
```

---

### Method 3: Ask Claude to Generate

**Prompt**:

```
Using the report templates in reports/templates/, generate a new assessment report for:
- Date: 2026-02-02
- Overall Score: 60/100
- Health: 65/100
- Tagging: 72/100
- SLO: 25/100
- Usage: 75/100

Use the same format and structure as the templates.
```

Claude will fill in the templates with your data!

---

## 🔧 Template Variables Guide

### Common Variables (All Templates)

| Variable               | Example             | Description                    |
| ---------------------- | ------------------- | ------------------------------ |
| `{{ASSESSMENT_DATE}}`  | 2026-01-02          | Date of assessment             |
| `{{ACCOUNT_NAME}}`     | Bangchak Production | Datadog account name           |
| `{{OVERALL_SCORE}}`    | 37                  | Overall maturity score (0-100) |
| `{{MATURITY_LEVEL}}`   | Level 1-2           | Maturity level text            |
| `{{TOTAL_HOSTS}}`      | 52                  | Number of hosts                |
| `{{TOTAL_SERVICES}}`   | 12                  | Number of services             |
| `{{TOTAL_MONITORS}}`   | 45                  | Number of monitors             |
| `{{TOTAL_DASHBOARDS}}` | 4                   | Number of dashboards           |
| `{{TOTAL_SLOS}}`       | 0                   | Number of SLOs                 |

### Score Variables

| Variable            | Range | Description                 |
| ------------------- | ----- | --------------------------- |
| `{{HEALTH_SCORE}}`  | 0-100 | Health check score          |
| `{{TAGGING_SCORE}}` | 0-100 | Tagging compliance score    |
| `{{SLO_SCORE}}`     | 0-100 | SLO maturity score          |
| `{{USAGE_SCORE}}`   | 0-100 | Usage attribution readiness |

### Financial Variables

| Variable                  | Example | Description           |
| ------------------------- | ------- | --------------------- |
| `{{INVESTMENT_DAYS}}`     | 13      | Days of effort needed |
| `{{INVESTMENT_COST}}`     | 5,200   | Cost in dollars       |
| `{{YEAR1_RETURN_MIN}}`    | 11,600  | Minimum Year 1 return |
| `{{YEAR1_RETURN_MAX}}`    | 23,600  | Maximum Year 1 return |
| `{{ROI_PERCENT}}`         | 223-454 | ROI percentage        |
| `{{MONTHLY_SAVINGS_MIN}}` | 800     | Min monthly savings   |
| `{{MONTHLY_SAVINGS_MAX}}` | 1,800   | Max monthly savings   |

### Status/Emoji Variables

| Variable             | Values                | Use                     |
| -------------------- | --------------------- | ----------------------- |
| `{{STATUS_EMOJI}}`   | ✅ ⚠️ ❌ 🔴 🟡 🟢     | Visual status indicator |
| `{{STATUS_TEXT}}`    | OK, WARNING, CRITICAL | Text status             |
| `{{PRIORITY_EMOJI}}` | 🔴 🟡 🟢              | Priority level          |

### List/Array Variables

Use Mustache syntax for lists:

```mustache
{{#STRENGTHS}}
- {{.}}
{{/STRENGTHS}}

{{#CRITICAL_GAPS}}
{{GAP_NUMBER}}. **{{GAP_TITLE}}** - {{GAP_DESCRIPTION}}
{{/CRITICAL_GAPS}}
```

---

## 📝 Variable Naming Conventions

### Pattern: `{{CATEGORY_METRIC_ATTRIBUTE}}`

**Examples**:

- `{{MONITOR_TEAM_PCT}}` - Monitor team tag percentage
- `{{INFRA_SCORE}}` - Infrastructure score
- `{{SLO_COVERAGE_PCT}}` - SLO coverage percentage
- `{{HEALTH_STATUS}}` - Health status text

### Suffixes:

- `_PCT` - Percentage (0-100)
- `_COUNT` - Count/number
- `_SCORE` - Score value
- `_STATUS` - Status text
- `_EMOJI` - Emoji/icon
- `_TEXT` - Descriptive text
- `_MIN` / `_MAX` - Range values
- `_DATE` - Date value

---

## 🎨 Customization Guide

### Adding New Sections

1. **Identify data needed**
2. **Add variables** to template
3. **Document** in this README
4. **Test** with sample data

**Example**: Adding a "Security" section

```markdown
### 6. Security Posture: {{SECURITY_SCORE}}/15

**What We Found**:

- **Secret Scanning**: {{SECRET_SCAN_STATUS}}
- **Compliance**: {{COMPLIANCE_STATUS}}

**Score**: {{SECURITY_SCORE}}/15
```

### Changing Scoring

To adjust scoring weights:

1. Update score variables in template
2. Update total calculation (keep at /100)
3. Document new scoring in template header

---

## 🔄 Template Maintenance

### When to Update Templates:

1. **New Datadog Features** - Add new sections/metrics
2. **Improved Analysis** - Better scoring algorithms
3. **User Feedback** - Add requested fields
4. **Best Practices Change** - Update recommendations

### Version Control:

```bash
# Create versioned templates
cp 00-EXECUTIVE-SUMMARY-TEMPLATE.md \
   00-EXECUTIVE-SUMMARY-TEMPLATE-v1.0.md

# Update and increment version
vim 00-EXECUTIVE-SUMMARY-TEMPLATE.md
# Save as v1.1
```

---

## 💡 Best Practices

### 1. Keep Variables Descriptive

✅ `{{MONITOR_TEAM_TAG_COVERAGE_PCT}}`
❌ `{{M_T_C}}`

### 2. Use Consistent Naming

✅ All percentages end with `_PCT`
✅ All counts end with `_COUNT`
✅ All scores end with `_SCORE`

### 3. Provide Examples

Include example values in template comments:

```markdown
<!-- Example: OVERALL_SCORE = 37 -->

Overall Score: {{OVERALL_SCORE}}/100
```

### 4. Document All Variables

Every variable should be in this README

### 5. Test with Real Data

Before committing, test with actual assessment data

---

## 📊 Example Data File

Create a `data.json` file with all variables:

```json
{
  "ASSESSMENT_DATE": "2026-01-02",
  "ACCOUNT_NAME": "Bangchak Production",
  "OVERALL_SCORE": 37,
  "MATURITY_LEVEL": "Level 1-2 (Basic → Developing)",
  "STATUS_EMOJI": "⚠️",
  "STATUS_TEXT": "ACTION REQUIRED",
  "TOTAL_HOSTS": 52,
  "TOTAL_SERVICES": 12,
  "TOTAL_MONITORS": 45,
  "TOTAL_DASHBOARDS": 4,
  "TOTAL_SLOS": 0,
  "HEALTH_SCORE": 52,
  "TAGGING_SCORE": 58,
  "SLO_SCORE": 0,
  "USAGE_SCORE": 60,
  "STRENGTHS": [
    "100% agent deployment across 52 hosts",
    "Active monitoring with 45 monitors (62% healthy)"
  ],
  "CRITICAL_GAPS": [
    {
      "GAP_NUMBER": 1,
      "GAP_TITLE": "ZERO SLOs",
      "GAP_DESCRIPTION": "No reliability targets defined for any service"
    }
  ]
}
```

Then use with Mustache, Handlebars, or similar templating engine.

---

## 🚀 Quick Start

### Generate Your First Report:

**Step 1**: Run assessment

```bash
/datadog-healthcheck
```

**Step 2**: Collect data

```json
{
  "ASSESSMENT_DATE": "2026-XX-XX",
  "OVERALL_SCORE": XX,
  // ... fill in from assessment
}
```

**Step 3**: Generate reports

```bash
# Ask Claude:
"Using the templates in reports/templates/, generate reports with this data: [paste JSON]"
```

**Step 4**: Review and publish

```bash
# Review
open reports/datadog-assessment-YYYY-MM-DD/00-EXECUTIVE-SUMMARY.md

# Publish to Datadog
create_notebook({
  name: "Assessment - YYYY-MM-DD",
  content: [content],
  tags: ["assessment"]
})
```

---

## 📞 Getting Help

**For questions about templates**:

- "Explain all variables in the executive summary template"
- "How do I fill in the action items template?"
- "Generate a report using these templates with my data"

**For customization**:

- "Add a security section to the health check template"
- "Change the scoring weight for SLOs to 30 points"
- "Create a template for quarterly reviews"

---

## 🎯 Template Validation

Before using, ensure:

- [ ] All variables documented in this README
- [ ] Example values provided
- [ ] Variables follow naming convention
- [ ] Template tested with real data
- [ ] Output looks professional
- [ ] Markdown renders correctly

---

**✅ Templates Ready for Use!**

_These templates enable consistent, professional Datadog assessments_
_Version: 1.0 (based on 2026-01-02 assessment)_
_Questions? Just ask!_
