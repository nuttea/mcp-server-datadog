# Integration Tests

Integration tests for Datadog MCP Server tools using real API calls.

## Test Scripts

### 1. test-high-priority-fixes.js

Tests all 6 HIGH priority bug fixes:

- Time parameter handling
- Service discovery
- Endpoint discovery

**Run:**

```bash
npm run test:fixes
```

**Expected:** 6/6 passing (100%)

### 2. test-mysmartsales-service.js

Comprehensive tests for mysmartsales_cpf_uat service:

- Service discovery
- APM stats (realtime & aggregated)
- Endpoints
- Traces
- Logs

**Run:**

```bash
npm run test:service
```

**Expected:** 7/7 passing (100%)

## Running Tests

```bash
# All integration tests
npm run test:integration

# HIGH priority fixes only
npm run test:fixes

# Specific service tests
npm run test:service

# All tests (unit + integration)
npm run test:all
```

## Requirements

- Node 20+
- `.env` file with Datadog credentials
- `npm run build` completed

## Documentation

See [docs/testing/](../../docs/testing/) for detailed test reports and guides.
