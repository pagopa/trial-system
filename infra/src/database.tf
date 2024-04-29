resource "azurerm_resource_group" "data_rg" {
    name     = "${local.project}-data-rg"
    location = var.location
    tags = var.tags
}

module "cosmosdb_account" {
  source = "git::https://github.com/pagopa/terraform-azurerm-v3//cosmosdb_account?ref=v7.62.0"

  name                = "${local.project}-cosmos-account"
  domain              = upper(var.domain)
  location            = azurerm_resource_group.data_rg.location
  resource_group_name = azurerm_resource_group.data_rg.name
  offer_type          = "Standard"
  enable_free_tier    = false
  kind                = "GlobalDocumentDB"

  public_network_access_enabled       = false
  private_endpoint_enabled            = true
  private_endpoint_sql_name           = "${local.project}-citizen-auth-account"
  private_service_connection_sql_name = "${local.project}-citizen-auth-account-private-endpoint"
  private_dns_zone_sql_ids            = [data.azurerm_private_dns_zone.privatelink_documents_azure_com.id]
  subnet_id                           = data.azurerm_subnet.private_endpoints_subnet.id
  is_virtual_network_filter_enabled   = false

  main_geo_location_location       = azurerm_resource_group.data_rg.location
  main_geo_location_zone_redundant = true
  additional_geo_locations = [{
    location          = "northeurope"
    failover_priority = 1
    zone_redundant    = false
  }]
  consistency_policy = {
    consistency_level       = "Session"
    max_interval_in_seconds = null
    max_staleness_prefix    = null
  }

  # Action groups for alerts
  action = []

  tags = var.tags
}

module "cosmosdb_sql_database_trial" {
  source              = "git::https://github.com/pagopa/terraform-azurerm-v3//cosmosdb_sql_database?ref=v7.62.0"
  name                = "db"
  resource_group_name = azurerm_resource_group.data_rg.name
  account_name        = module.cosmosdb_account.name
}


// ----------------------------------------------------
// Alerts
// ----------------------------------------------------

resource "azurerm_monitor_metric_alert" "cosmosdb_account_normalized_RU_consumption_exceeded" {

  name                = "[${upper(var.domain)} | ${module.cosmosdb_account.name}] Normalized RU Consumption Exceeded"
  resource_group_name = azurerm_resource_group.data_rg.name
  scopes              = [module.cosmosdb_account.id]
  description         = "A collection Normalized RU Consumption exceed the threshold, see dimensions. Please, consider to increase RU. Runbook: not needed."
  severity            = 1
  window_size         = "PT30M"
  frequency           = "PT15M"
  auto_mitigate       = false


  # Metric info
  # https://learn.microsoft.com/en-us/azure/azure-monitor/essentials/metrics-supported#microsoftdocumentdbdatabaseaccounts
  criteria {
    metric_namespace       = "Microsoft.DocumentDB/databaseAccounts"
    metric_name            = "NormalizedRUConsumption"
    aggregation            = "Maximum"
    operator               = "GreaterThan"
    threshold              = 90 #percentage
    skip_metric_validation = false


    dimension {
      name     = "Region"
      operator = "Include"
      values   = [var.location]
    }
    dimension {
      name     = "CollectionName"
      operator = "Include"
      values   = ["*"]
    }

  }

  tags = var.tags
}
