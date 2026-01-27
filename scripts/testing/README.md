# Testing Helper Scripts

Shell scripts for debugging and testing Datadog APIs.

## Service Discovery Scripts

### check-service-catalog.sh

Check Service Catalog API pagination and service count.

### test-get-all-services-debug.sh

Debug service discovery with detailed logging.

## API Verification Scripts

### test-api-apm-services.sh

Test APM Services API endpoint (same as UI uses).

### test-apm-services-api.sh

Alternative APM Services API test.

### test-service-exists.sh

Check if specific services (smartids_cpf_uat, mysmartsales_cpf_uat) have APM data.

### test-service-debug.sh

Debug aggregated metrics and endpoint discovery for specific service.

## Usage

All scripts source `.env` for credentials. Run from project root:

```bash
# Check if service exists in APM
./scripts/testing/test-service-exists.sh

# Debug service discovery
./scripts/testing/test-get-all-services-debug.sh

# Verify APM Services API
./scripts/testing/test-api-apm-services.sh
```

## Requirements

- `.env` file with DATADOG_API_KEY, DATADOG_APP_KEY, DATADOG_SITE
- `curl`, `jq` installed
- Datadog account access
