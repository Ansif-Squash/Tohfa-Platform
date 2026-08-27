@description('Deployment environment name, e.g. staging or production')
param environment string = 'staging'

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Application base name')
param appName string = 'tohfa'

@description('PostgreSQL admin username')
param postgresAdminUser string = 'tohfaadmin'

@description('PostgreSQL admin password')
@secure()
param postgresAdminPassword string

@description('JWT Signing Secret (min 32 chars)')
@secure()
param jwtSecret string

var uniqueSuffix = uniqueString(resourceGroup().id)
var storageAccountName = take('${appName}${environment}${uniqueSuffix}', 24)
var keyVaultName = take('${appName}-${environment}-kv-${uniqueSuffix}', 24)
var postgresServerName = '${appName}-${environment}-psql-${uniqueSuffix}'
var redisName = '${appName}-${environment}-redis-${uniqueSuffix}'
var appServicePlanName = '${appName}-${environment}-asp'
var apiAppName = '${appName}-${environment}-api'
var workerAppName = '${appName}-${environment}-worker'

// 1. Azure Blob Storage
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
    accessTier: 'Hot'
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource mediaContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'tohfa-media'
  properties: {
    publicAccess: 'None'
  }
}

resource docsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'tohfa-documents'
  properties: {
    publicAccess: 'None'
  }
}

// 2. Azure Database for PostgreSQL Flexible Server 16 with PostGIS
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: postgresServerName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: postgresAdminUser
    administratorLoginPassword: postgresAdminPassword
    storage: {
      storageSizeGB: 32
      autoGrow: 'Enabled'
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

resource postgresConfigExtensions 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2023-03-01-preview' = {
  parent: postgresServer
  name: 'azure.extensions'
  properties: {
    value: 'POSTGIS,UUID-OSSP,PGCRYPTO,BTREE_GIST'
    source: 'user-override'
  }
}

resource postgresFirewallAllowAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-03-01-preview' = {
  parent: postgresServer
  name: 'AllowAllAzureServicesAndResourcesWithinAzureIps'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-03-01-preview' = {
  parent: postgresServer
  name: 'tohfa'
  properties: {
    charset: 'UTF8'
    collation: 'C'
  }
}

// 3. Azure Cache for Redis
resource redisCache 'Microsoft.Cache/redis@2023-08-01' = {
  name: redisName
  location: location
  properties: {
    sku: {
      name: 'Basic'
      family: 'C'
      capacity: 0
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
  }
}

// 4. Azure Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
  }
}

// Key Vault Secrets
var dbConnectionString = 'postgres://${postgresAdminUser}:${postgresAdminPassword}@${postgresServer.properties.fullyQualifiedDomainName}:5432/tohfa?sslmode=require'
var redisConnectionString = 'rediss://:${redisCache.listKeys().primaryKey}@${redisCache.properties.hostName}:${redisCache.properties.sslPort}'
var storageConnectionString = 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'

resource secretDbUrl 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'DATABASE-URL'
  properties: {
    value: dbConnectionString
  }
}

resource secretRedisUrl 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'REDIS-URL'
  properties: {
    value: redisConnectionString
  }
}

resource secretJwt 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'JWT-SECRET'
  properties: {
    value: jwtSecret
  }
}

resource secretStorageConn 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'AZURE-STORAGE-CONNECTION-STRING'
  properties: {
    value: storageConnectionString
  }
}

// 5. Azure App Service Plan (Linux)
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// 6. API App Service
resource apiApp 'Microsoft.Web/sites@2023-01-01' = {
  name: apiAppName
  location: location
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      appCommandLine: 'node apps/api/dist/server.js'
      healthCheckPath: '/readyz'
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      appSettings: [
        { name: 'NODE_ENV', value: 'production' }
        { name: 'PORT', value: '3000' }
        { name: 'DATABASE_URL', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=DATABASE-URL)' }
        { name: 'REDIS_URL', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=REDIS-URL)' }
        { name: 'JWT_SECRET', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=JWT-SECRET)' }
        { name: 'AZURE_STORAGE_CONNECTION_STRING', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=AZURE-STORAGE-CONNECTION-STRING)' }
        { name: 'AZURE_STORAGE_CONTAINER_NAME', value: 'tohfa-media' }
        { name: 'CORS_ORIGINS', value: 'https://admin-staging.tohfa.in,http://localhost:4200' }
        { name: 'PAYMENT_PROVIDER', value: 'mock' }
        { name: 'SMS_PROVIDER', value: 'mock' }
        { name: 'LOG_LEVEL', value: 'info' }
      ]
    }
    httpsOnly: true
  }
}

// 7. Background Worker App Service
resource workerApp 'Microsoft.Web/sites@2023-01-01' = {
  name: workerAppName
  location: location
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      appCommandLine: 'node apps/api/dist/jobs/worker.js'
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      appSettings: [
        { name: 'NODE_ENV', value: 'production' }
        { name: 'DATABASE_URL', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=DATABASE-URL)' }
        { name: 'REDIS_URL', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=REDIS-URL)' }
        { name: 'JWT_SECRET', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=JWT-SECRET)' }
        { name: 'AZURE_STORAGE_CONNECTION_STRING', value: '@Microsoft.KeyVault(VaultName=${keyVault.name};SecretName=AZURE-STORAGE-CONNECTION-STRING)' }
        { name: 'AZURE_STORAGE_CONTAINER_NAME', value: 'tohfa-media' }
        { name: 'PAYMENT_PROVIDER', value: 'mock' }
        { name: 'SMS_PROVIDER', value: 'mock' }
        { name: 'LOG_LEVEL', value: 'info' }
      ]
    }
    httpsOnly: true
  }
}

// Role Assignments: Key Vault Secrets User for API & Worker Managed Identities
var keyVaultSecretsUserRoleId = '4633458b-17de-408a-b874-0445c86b69e6'

resource apiKvRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, apiApp.id, keyVaultSecretsUserRoleId)
  scope: keyVault
  properties: {
    principalId: apiApp.identity.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', keyVaultSecretsUserRoleId)
    principalType: 'ServicePrincipal'
  }
}

resource workerKvRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, workerApp.id, keyVaultSecretsUserRoleId)
  scope: keyVault
  properties: {
    principalId: workerApp.identity.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', keyVaultSecretsUserRoleId)
    principalType: 'ServicePrincipal'
  }
}

output apiAppUrl string = 'https://${apiApp.properties.defaultHostName}'
output keyVaultName string = keyVault.name
output postgresServerFqdn string = postgresServer.properties.fullyQualifiedDomainName
