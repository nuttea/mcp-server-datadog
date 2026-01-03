# Datadog Notebooks MCP Tools

Create, list, update, and delete Datadog Notebooks programmatically.

## Tools (5)

### 1. `create_notebook`

Create a new Datadog Notebook from markdown content.

**Parameters**:

- `name` (required): Notebook name
- `content` (required): Markdown content
- `tags` (optional): Array of tags (e.g., `["team:sre", "assessment"]`)
- `time_live_span` (optional): Default timeframe (default: "1h")
- `notify_list` (optional): List of handles to notify

**Example**:

```typescript
create_notebook({
  name: 'Datadog Maturity Assessment - Jan 2026',
  content: '# Executive Summary\n\nOverall Score: 37/100...',
  tags: ['team:sre', 'assessment', 'maturity'],
  time_live_span: '1w',
})
```

**Returns**:

```json
{
  "id": 123456,
  "name": "Datadog Maturity Assessment - Jan 2026",
  "url": "https://app.datadoghq.com/notebook/123456",
  "created": "2026-01-02T12:00:00Z",
  "modified": "2026-01-02T12:00:00Z",
  "status": "published",
  "tags": ["team:sre", "assessment", "maturity"]
}
```

---

### 2. `list_notebooks`

List all Datadog Notebooks with optional filtering.

**Parameters**:

- `author_handle` (optional): Filter by author
- `query` (optional): Search query
- `count` (optional): Number to return (default: 100, max: 1000)
- `start` (optional): Pagination offset (default: 0)
- `sort_field` (optional): "name", "created", or "modified_at" (default: "modified_at")
- `sort_dir` (optional): "asc" or "desc" (default: "desc")
- `include_cells` (optional): Include full cell content (default: false)

**Example**:

```typescript
list_notebooks({
  query: 'assessment',
  count: 50,
  sort_field: 'modified_at',
})
```

---

### 3. `get_notebook`

Get a specific Datadog Notebook by ID.

**Parameters**:

- `notebook_id` (required): Notebook ID

**Example**:

```typescript
get_notebook({ notebook_id: 123456 })
```

---

### 4. `update_notebook`

Update an existing Datadog Notebook.

**Parameters**:

- `notebook_id` (required): Notebook ID to update
- `name` (optional): New name
- `content` (optional): New markdown content
- `tags` (optional): Updated tags
- `status` (optional): "published" or "unpublished"

**Example**:

```typescript
update_notebook({
  notebook_id: 123456,
  content: '# Updated Content\n\nNew findings...',
  tags: ['team:sre', 'assessment', 'updated'],
})
```

---

### 5. `delete_notebook`

Delete a Datadog Notebook.

**Parameters**:

- `notebook_id` (required): Notebook ID to delete

**Example**:

```typescript
delete_notebook({ notebook_id: 123456 })
```

---

## Content Formatting

Notebooks automatically convert markdown content into cells:

- Content is split by top-level headers (`# Header`)
- Each section becomes a separate markdown cell
- Supports all standard markdown formatting

**Example Input**:

```markdown
# Executive Summary

Overall score: 37/100

## Findings

- Issue 1
- Issue 2
```

**Creates 2 cells**:

1. Cell with "# Executive Summary..." section
2. Cell with "## Findings..." section

---

## Use Cases

### 1. Publish Assessment Reports

```typescript
// Read local markdown report
const content = fs.readFileSync('./reports/assessment.md', 'utf-8')

// Create notebook in Datadog
create_notebook({
  name: 'Q1 2026 Datadog Assessment',
  content: content,
  tags: ['team:sre', 'quarterly-review', 'maturity-assessment'],
})
```

### 2. Automated Reporting

```typescript
// Generate report programmatically
const report = generateHealthCheckReport(data)

// Publish to Datadog
create_notebook({
  name: `Health Check - ${new Date().toISOString()}`,
  content: report,
  tags: ['automated', 'health-check'],
})
```

### 3. Incident Post-Mortems

```typescript
create_notebook({
  name: 'Incident PM-2026-001: API Outage',
  content: postMortemContent,
  tags: ['incident', 'post-mortem', 'team:platform'],
  notify_list: ['@sre-team@example.com'],
})
```

### 4. SLO Reviews

```typescript
create_notebook({
  name: 'Monthly SLO Review - January 2026',
  content: sloReviewContent,
  tags: ['slo', 'monthly-review', 'reliability'],
})
```

---

## Integration with Skills

The notebook tools integrate perfectly with Datadog assessment skills:

```bash
# Run assessment
/datadog-healthcheck

# Export results to Datadog Notebook
create_notebook({
  name: "Health Check - 2026-01-02",
  content: "[health check results]",
  tags: ["health-check", "automated"]
})
```

---

## Permissions

Requires Datadog API permissions:

- `notebooks_read` - For list_notebooks, get_notebook
- `notebooks_write` - For create_notebook, update_notebook, delete_notebook

Ensure your API/App keys have these scopes enabled.

---

## API Reference

Based on [Datadog Notebooks API v1](https://docs.datadoghq.com/api/latest/notebooks/)

---

## Testing

```bash
pnpm test tests/tools/notebooks.test.ts
```

**Test Coverage**: 14/14 tests passing ✅
