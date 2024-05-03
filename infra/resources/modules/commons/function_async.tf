#
# Function app definition
#

locals {
  async_app_settings = {
    FUNCTIONS_WORKER_RUNTIME       = "node"
    FUNCTIONS_WORKER_PROCESS_COUNT = "4"
    NODE_ENV                       = "production"

    // Keepalive fields are all optionals
    FETCH_KEEPALIVE_ENABLED             = "true"
    FETCH_KEEPALIVE_SOCKET_ACTIVE_TTL   = "110000"
    FETCH_KEEPALIVE_MAX_SOCKETS         = "40"
    FETCH_KEEPALIVE_MAX_FREE_SOCKETS    = "10"
    FETCH_KEEPALIVE_FREE_SOCKET_TIMEOUT = "30000"
    FETCH_KEEPALIVE_TIMEOUT             = "60000"
  }
}

resource "azurerm_resource_group" "async_rg" {
  name     = "${local.project}-async-rg-01"
  location = var.location

  tags = var.tags
}

module "subscription_async_snet" {
  source                                    = "git::https://github.com/pagopa/terraform-azurerm-v3.git//subnet?ref=v8.8.0"
  name                                      = format("%s-subscription-async-snet-01", local.project)
  address_prefixes                          = var.cidr_subnet_fnsubscriptionasync
  resource_group_name                       = azurerm_virtual_network.vnet.resource_group_name
  virtual_network_name                      = azurerm_virtual_network.vnet.name
  private_endpoint_network_policies_enabled = false

  service_endpoints = [
    "Microsoft.Web",
    "Microsoft.AzureCosmosDB",
    "Microsoft.Storage",
  ]

  delegation = {
    name = "default"
    service_delegation = {
      name    = "Microsoft.Web/serverFarms"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
}

module "subscription_async_fn" {
  source = "git::https://github.com/pagopa/terraform-azurerm-v3.git//function_app?ref=v8.9.0"

  resource_group_name = azurerm_resource_group.async_rg.name
  name                = format("%s-subscription-async-fn-01", local.project)
  location            = var.location
  domain              = local.domain
  health_check_path   = "/info"

  node_version    = "20"
  runtime_version = "~4"

  always_on                                = "true"
  application_insights_instrumentation_key = azurerm_application_insights.ai.instrumentation_key

  app_service_plan_info = {
    kind                         = var.function_async_config.kind
    sku_tier                     = var.function_async_config.sku_tier
    sku_size                     = var.function_async_config.sku_size
    maximum_elastic_worker_count = 0
    worker_count                 = 2
    zone_balancing_enabled       = false
  }

  app_settings = merge(
    local.async_app_settings,
    {},
  )

  sticky_app_setting_names = []

  storage_account_name         = replace(format("%ssubasyncfn01", local.project), "-", "")
  storage_account_durable_name = replace(format("%ssubasyncfn01", local.project), "-", "")

  storage_account_info = {
    account_kind                      = "StorageV2"
    account_tier                      = "Standard"
    account_replication_type          = "ZRS"
    access_tier                       = "Hot"
    advanced_threat_protection_enable = false
    use_legacy_defender_version       = false
    public_network_access_enabled     = true
  }

  internal_storage = {
    "enable"                     = true,
    "private_endpoint_subnet_id" = module.pendpoints_snet.id,
    "private_dns_zone_blob_ids"  = [azurerm_private_dns_zone.privatelink_blob_core.id],
    "private_dns_zone_queue_ids" = [azurerm_private_dns_zone.privatelink_queue_core.id],
    "private_dns_zone_table_ids" = [azurerm_private_dns_zone.privatelink_table_core.id],
    "queues"                     = [],
    "containers"                 = [],
    "blobs_retention_days"       = 0,
  }
  subnet_id = module.subscription_async_snet.id

  allowed_subnets = [
    module.subscription_async_snet.id
  ]

  # Action groups for alerts
  action = [
    {
      action_group_id    = azurerm_monitor_action_group.error_action_group.id
      webhook_properties = {}
    }
  ]

  tags = var.tags
}

module "subscription_async_fn_staging_slot" {
  source = "git::https://github.com/pagopa/terraform-azurerm-v3.git//function_app_slot?ref=v8.9.0"

  name                = "staging"
  location            = var.location
  resource_group_name = azurerm_resource_group.async_rg.name
  function_app_id     = module.subscription_async_fn.id
  app_service_plan_id = module.subscription_async_fn.app_service_plan_id
  health_check_path   = "/info"

  storage_account_name               = module.subscription_async_fn.storage_account.name
  storage_account_access_key         = module.subscription_async_fn.storage_account.primary_access_key
  internal_storage_connection_string = module.subscription_async_fn.storage_account_internal_function.primary_connection_string

  node_version                             = "20"
  always_on                                = "true"
  runtime_version                          = "~4"
  application_insights_instrumentation_key = azurerm_application_insights.ai.instrumentation_key

  app_settings = merge(
    local.async_app_settings,
    {},
  )

  subnet_id = module.subscription_async_snet.id

  allowed_subnets = [
    module.subscription_async_snet.id
  ]

  tags = var.tags
}

resource "azurerm_monitor_autoscale_setting" "function_async" {
  name                = format("%s-autoscale-01", module.subscription_async_fn.name)
  resource_group_name = azurerm_resource_group.async_rg.name
  location            = var.location
  target_resource_id  = module.subscription_async_fn.app_service_plan_id

  profile {
    name = "default"

    capacity {
      default = 1
      minimum = 1
      maximum = 30
    }

    rule {
      metric_trigger {
        metric_name              = "Requests"
        metric_resource_id       = module.subscription_async_fn.id
        metric_namespace         = "microsoft.web/sites"
        time_grain               = "PT1M"
        statistic                = "Average"
        time_window              = "PT1M"
        time_aggregation         = "Average"
        operator                 = "GreaterThan"
        threshold                = 3500
        divide_by_instance_count = false
      }

      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "2"
        cooldown  = "PT5M"
      }
    }

    rule {
      metric_trigger {
        metric_name              = "CpuPercentage"
        metric_resource_id       = module.subscription_async_fn.app_service_plan_id
        metric_namespace         = "microsoft.web/serverfarms"
        time_grain               = "PT1M"
        statistic                = "Average"
        time_window              = "PT5M"
        time_aggregation         = "Average"
        operator                 = "GreaterThan"
        threshold                = 60
        divide_by_instance_count = false
      }

      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "2"
        cooldown  = "PT5M"
      }
    }

    rule {
      metric_trigger {
        metric_name              = "Requests"
        metric_resource_id       = module.subscription_async_fn.id
        metric_namespace         = "microsoft.web/sites"
        time_grain               = "PT1M"
        statistic                = "Average"
        time_window              = "PT15M"
        time_aggregation         = "Average"
        operator                 = "LessThan"
        threshold                = 2500
        divide_by_instance_count = false
      }

      scale_action {
        direction = "Decrease"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT10M"
      }
    }

    rule {
      metric_trigger {
        metric_name              = "CpuPercentage"
        metric_resource_id       = module.subscription_async_fn.app_service_plan_id
        metric_namespace         = "microsoft.web/serverfarms"
        time_grain               = "PT1M"
        statistic                = "Average"
        time_window              = "PT5M"
        time_aggregation         = "Average"
        operator                 = "LessThan"
        threshold                = 30
        divide_by_instance_count = false
      }

      scale_action {
        direction = "Decrease"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT20M"
      }
    }
  }
}