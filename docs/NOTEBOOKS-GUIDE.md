# Datadog Notebooks Integration Guide

**Feature**: Programmatically create and manage Datadog Notebooks via MCP
**Tools**: 5 new MCP tools (create, list, get, update, delete)
**Use Case**: Automated reporting, documentation, incident post-mortems

---

## Quick Start

### 1. Create Your First Notebook

```typescript
create_notebook({
  name: 'My First Datadog Notebook',
  content: '# Hello Datadog\n\nThis is my automated report.',
  tags: ['automated', 'test'],
})
```

**Returns**:

```json
{
  "id": 123456,
  "url": "https://app.datadoghq.com/notebook/123456"
}
```

Visit the URL to see your notebook in Datadog!

---

## Common Use Cases

### Use Case 1: Publish Assessment Reports

```typescript
// Read markdown report
const content = fs.readFileSync('./reports/assessment.md', 'utf-8')

// Create notebook
create_notebook({
  name: 'Datadog Maturity Assessment - Q1 2026',
  content: content,
  tags: ['assessment', 'maturity', 'q1-2026', 'team:sre'],
})
```

### Use Case 2: Automated Health Checks

```typescript
// Run health check
const healthData = runHealthCheck()

// Generate report markdown
const report = generateHealthReport(healthData)

// Publish to Datadog
create_notebook({
  name: `Health Check - ${new Date().toISOString()}`,
  content: report,
  tags: ['health-check', 'automated', `date:${today}`],
})
```

### Use Case 3: Incident Post-Mortems

```typescript
create_notebook({
  name: 'Incident PM-2026-001: API Outage',
  content: postMortemMarkdown,
  tags: ['incident', 'post-mortem', 'team:platform', 'severity:high'],
  notify_list: ['@sre-team@example.com'],
})
```

### Use Case 4: Weekly SLO Reviews

```typescript
// Get SLO data
const sloData = await getSLOHistory()

// Generate review
const review = generateSLOReview(sloData)

// Publish
create_notebook({
  name: `SLO Review - Week ${weekNumber}`,
  content: review,
  tags: ['slo', 'weekly-review', 'reliability'],
})
```

---

## Tool Reference

### create_notebook

Create a new Datadog Notebook.

**Parameters**:

- `name` (required): Notebook name
- `content` (required): Markdown content
- `tags` (optional): Array of tags
- `time_live_span` (optional): Default timeframe
- `notify_list` (optional): Handles to notify

**Example**:

```typescript
create_notebook({
  name: 'Q1 2026 Assessment',
  content: '# Summary\n\nOverall: 75/100',
  tags: ['q1', 'assessment'],
})
```

---

### list_notebooks

List notebooks with filtering.

**Parameters**:

- `query` (optional): Search term
- `author_handle` (optional): Filter by author
- `count` (optional): Number to return (max 1000)
- `sort_field` (optional): "name", "created", "modified_at"

**Example**:

```typescript
list_notebooks({
  query: 'assessment',
  count: 50,
  sort_field: 'modified_at',
})
```

---

### get_notebook

Get notebook by ID.

**Parameters**:

- `notebook_id` (required): Notebook ID

**Example**:

```typescript
get_notebook({ notebook_id: 123456 })
```

---

### update_notebook

Update existing notebook.

**Parameters**:

- `notebook_id` (required): Notebook to update
- `name` (optional): New name
- `content` (optional): New markdown
- `tags` (optional): Updated tags
- `status` (optional): "published" or "unpublished"

**Example**:

```typescript
update_notebook({
  notebook_id: 123456,
  content: '# Updated\n\nNew findings...',
  tags: ['updated', '2026-02'],
})
```

---

### delete_notebook

Delete a notebook.

**Parameters**:

- `notebook_id` (required): Notebook to delete

**Example**:

```typescript
delete_notebook({ notebook_id: 123456 })
```

---

## Best Practices

### 1. Use Descriptive Names

```
✅ "Datadog Assessment - Q1 2026"
✅ "Weekly SLO Review - Week 5"
❌ "Report"
❌ "Notebook 1"
```

### 2. Tag Appropriately

```typescript
tags: [
  'type:assessment', // What is it?
  'team:sre', // Who owns it?
  'period:2026-01', // When?
  'status:final', // What status?
]
```

### 3. Version Your Notebooks

- Include date in name
- Use tags for versioning
- Update instead of creating duplicates

### 4. Organize with Prefixes

```
"📊 Assessment - Q1 2026"
"✅ Action Tracker - Q1 2026"
"🎯 SLO Review - January"
"📈 Cost Report - Week 5"
```

---

## Integration with Skills

### Workflow: Assessment → Notebook

```bash
# 1. Run assessment skill
/datadog-healthcheck

# 2. Generate report (automatic)
# 3. Ask Claude to publish:
"Publish this health check report to Datadog Notebooks"

# Claude will:
create_notebook({
  name: "Health Check - 2026-01-03",
  content: [report content],
  tags: ["health-check", "automated"]
})
```

---

## Permissions Required

**Datadog API Key Scopes**:

- `notebooks_read` - For list_notebooks, get_notebook
- `notebooks_write` - For create_notebook, update_notebook, delete_notebook

**Check your API key**:

1. Go to Datadog → Organization Settings → API Keys
2. Select your key
3. Verify scopes
4. Add if missing, regenerate key

---

## Troubleshooting

### Error: "Notebooks API not accessible"

**Solution**: Add `notebooks_write` scope to API key

### Error: "Invalid markdown"

**Solution**: Check markdown syntax, especially in headers

### Notebook empty in Datadog UI

**Solution**: Ensure `status: "published"`, not "unpublished"

### Can't find notebook

**Solution**: Use `list_notebooks` with query to search

---

## Examples

### Example 1: Daily Health Check

```typescript
const dailyCheck = async () => {
  const data = await runHealthCheck()
  const report = formatReport(data)

  // Check if today's notebook exists
  const existing = await list_notebooks({
    query: `Health Check - ${today}`,
  })

  if (existing.length > 0) {
    // Update existing
    await update_notebook({
      notebook_id: existing[0].id,
      content: report,
    })
  } else {
    // Create new
    await create_notebook({
      name: `Health Check - ${today}`,
      content: report,
      tags: ['daily', 'health-check'],
    })
  }
}
```

### Example 2: Incident Documentation

```typescript
const documentIncident = async (incidentId) => {
  const incident = await get_incident(incidentId)
  const timeline = generateTimeline(incident)
  const rootCause = analyzeRootCause(incident)

  const postMortem = `
# Incident Post-Mortem: ${incident.title}

## Timeline
${timeline}

## Root Cause
${rootCause}

## Action Items
- [ ] Fix X
- [ ] Improve Y
  `

  await create_notebook({
    name: `Incident PM-${incidentId}: ${incident.title}`,
    content: postMortem,
    tags: [
      'incident',
      'post-mortem',
      `severity:${incident.severity}`,
      `date:${today}`,
    ],
    notify_list: [`@${incident.commander}@example.com`],
  })
}
```

---

## API Reference

Full documentation: [src/tools/notebooks/README.md](../src/tools/notebooks/README.md)

Datadog API docs: https://docs.datadoghq.com/api/latest/notebooks/

---

**Ready to automate your Datadog documentation!** 📚
