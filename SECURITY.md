# Security Policy

## Supported Versions

We release security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.7.x   | :white_check_mark: |
| 1.6.x   | :white_check_mark: |
| < 1.6   | :x:                |

We recommend always using the latest version to receive security updates and improvements.

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### For Critical Vulnerabilities

**DO NOT** open a public GitHub issue for critical security vulnerabilities.

Instead, please report them through [GitHub Security Advisories](https://github.com/winor30/mcp-server-datadog/security/advisories/new):

1. Go to the Security tab in the repository
2. Click "Report a vulnerability"
3. Provide detailed information about the vulnerability
4. Include steps to reproduce if possible

### For Non-Critical Issues

For non-critical security concerns or questions, you can:

- Open a GitHub issue with the label `security`
- Email the maintainers (check GitHub profile for contact)

### What to Include

When reporting a vulnerability, please include:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact and severity
- Suggested fix (if any)
- Your contact information for follow-up

### Response Timeline

- **Initial Response**: Within 48 hours of report
- **Status Update**: Within 7 days with assessment
- **Fix Timeline**: Depends on severity
  - Critical: 7-14 days
  - High: 14-30 days
  - Medium/Low: 30-90 days

## Security Best Practices

### Credential Management

#### Required: API Keys

This MCP server requires Datadog API credentials to function:

- `DATADOG_API_KEY`: Your Datadog API key
- `DATADOG_APP_KEY`: Your Datadog Application key

**IMPORTANT**: Never commit these credentials to version control!

✅ **DO:**

- Store credentials in environment variables
- Use `.env` files (which are gitignored)
- Rotate API keys regularly
- Use read-only API keys when possible
- Restrict API key permissions to minimum required scopes

❌ **DON'T:**

- Hardcode credentials in source code
- Commit `.env` files to git
- Share API keys in public channels
- Use admin-level API keys unless necessary
- Store credentials in configuration files tracked by git

#### Environment Variable Configuration

When running locally:

```bash
export DATADOG_API_KEY="your_api_key"
export DATADOG_APP_KEY="your_app_key"
```

When using with Claude Desktop, configure in `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "datadog": {
      "command": "npx",
      "args": ["-y", "@winor30/mcp-server-datadog"],
      "env": {
        "DATADOG_API_KEY": "<YOUR_API_KEY>",
        "DATADOG_APP_KEY": "<YOUR_APP_KEY>"
      }
    }
  }
}
```

**Note**: The `claude_desktop_config.json` file should have restricted file permissions (600 or 400).

### Docker Security

When running in Docker:

- Don't bake credentials into the image
- Use Docker secrets or environment variables at runtime
- Run as non-root user (future enhancement)
- Keep base images updated

### Rate Limiting

The Datadog API has rate limits:

- **Default**: 300 requests/hour per organization
- **Burst limits**: Vary by endpoint

This server implements:

- Automatic retry logic for rate limit errors (429)
- Exponential backoff to prevent overwhelming the API
- Configurable retry behavior via environment variables

### Input Validation

All tool inputs are validated using Zod schemas:

- Type checking
- Length limits on strings
- Range validation on numbers
- Required field enforcement

Current validation approach is lenient:

- Invalid inputs log warnings but don't fail
- Provides visibility without breaking existing integrations
- Future versions may enforce strict validation

### Network Security

- All communication with Datadog uses HTTPS
- API credentials are sent via HTTP headers (not URL parameters)
- No sensitive data is logged to stdout (only stderr)

### Dependency Security

- Dependencies are regularly updated via Dependabot
- Only 4 production dependencies (minimal attack surface)
- All dependencies are from trusted, well-maintained sources

## Known Security Considerations

### API Key Permissions

The required Datadog API and APP keys have broad permissions. Consider:

- Creating dedicated API keys for this MCP server
- Limiting key scopes to only required Datadog services
- Using separate keys for read-only operations
- Monitoring API key usage in Datadog's audit logs

### Data Exposure

This server can access sensitive monitoring data:

- Application logs (may contain PII or secrets)
- Metrics and traces (may reveal infrastructure details)
- Incident information (may contain sensitive details)
- RUM data (may contain user information)

**Recommendations**:

- Review log content before making queries
- Use query filters to limit data exposure
- Audit access to the MCP server
- Be cautious when sharing query results

### stdio Transport

The MCP server uses stdio transport (stdin/stdout):

- All communication is in plaintext JSON
- Relies on OS-level security for the pipe
- Intended for local use only

**DO NOT expose stdio transport over a network without encryption!**

### Logging

Logs are written to stderr:

- May contain query parameters and error details
- Review logs regularly for sensitive information
- Implement log rotation if running long-term
- Consider log aggregation with appropriate access controls

## Disclosure Policy

When a security vulnerability is fixed:

1. We will release a patched version
2. Publish a security advisory on GitHub
3. Update this SECURITY.md with any new best practices
4. Credit the reporter (if they wish) in the release notes

## Security Updates

Subscribe to security updates:

- Watch this repository for security advisories
- Enable Dependabot alerts in your fork
- Follow release notes for security-related changes

## Additional Resources

- [Datadog API Security Documentation](https://docs.datadoghq.com/api/latest/authentication/)
- [Model Context Protocol Security](https://github.com/modelcontextprotocol/specification)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)

---

**Last Updated**: 2026-01-02
**MCP Server Version**: 1.7.0

If you have questions about this security policy, please open a GitHub issue with the `security` label.
