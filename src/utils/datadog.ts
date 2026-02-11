import { client } from '@datadog/datadog-api-client'

interface CreateDatadogConfigParams {
  apiKeyAuth: string
  appKeyAuth: string
  site?: string
  subdomain?: string
}

export function createDatadogConfig(
  config: CreateDatadogConfigParams,
): client.Configuration {
  if (!config.apiKeyAuth || !config.appKeyAuth) {
    throw new Error('Datadog API key and APP key are required')
  }
  const datadogConfig = client.createConfiguration({
    authMethods: {
      apiKeyAuth: config.apiKeyAuth,
      appKeyAuth: config.appKeyAuth,
    },
  })

  // Set server variables in a single call to avoid overwriting
  const serverVars: { site?: string; subdomain?: string } = {}

  // Always set site with default fallback
  serverVars.site = config.site || 'datadoghq.com'

  // Add subdomain if provided
  if (config.subdomain != null) {
    serverVars.subdomain = config.subdomain
  }

  datadogConfig.setServerVariables(serverVars)

  datadogConfig.unstableOperations = {
    'v2.listIncidents': true,
    'v2.getIncident': true,
  }

  return datadogConfig
}

export function getDatadogSite(ddConfig: client.Configuration): string {
  const config = ddConfig.servers[0]?.getConfiguration()
  if (config == null) {
    throw new Error('Datadog site is not set')
  }
  return config.site
}
