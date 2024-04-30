#
# Function app definition
#

locals {
  subscription_app_settings = {
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

    APPINSIGHTS_INSTRUMENTATIONKEY = azurerm_application_insights.ai.instrumentation_key

  }
}

resource "azurerm_resource_group" "subscription_rg" {
  name     = "${local.project}-subscription-rg"
  location = var.location

  tags = var.tags
}

module "subscription_snet" {
  source                                    = "git::https://github.com/pagopa/terraform-azurerm-v3.git//subnet?ref=v6.19.1"
  name                                      = format("%s-subscription-snet", local.project)
  address_prefixes                          = var.cidr_subnet_fnsubscription
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

module "subscription_fn" {
  source = "git::https://github.com/pagopa/terraform-azurerm-v3.git//function_app?ref=v6.19.1"

  resource_group_name = azurerm_resource_group.subscription_rg.name
  name                = format("%s-subscription-fn", local.project)
  location            = var.location
  domain              = local.domain
  health_check_path   = "/info"

  node_version    = "20"
  runtime_version = "~4"

  always_on                                = "true"
  application_insights_instrumentation_key = azurerm_application_insights.ai.instrumentation_key

  app_service_plan_info = {
    kind                         = var.function_subscription_config.kind
    sku_tier                     = var.function_subscription_config.sku_tier
    sku_size                     = var.function_subscription_config.sku_size
    maximum_elastic_worker_count = 0
    worker_count                 = 2
    zone_balancing_enabled       = false
  }

  app_settings = merge(
    local.subscription_app_settings,
    {},
  )

  sticky_app_setting_names = []

  internal_storage = {
    "enable"                     = true,
    "private_endpoint_subnet_id" = module.pendpoints_snet.id,
    "private_dns_zone_blob_ids"  = [azurerm_private_dns_zone.privatelink_blob_core.id],
    "private_dns_zone_queue_ids" = [data.azurerm_private_dns_zone.privatelink_queue_core.id],
    "private_dns_zone_table_ids" = [data.azurerm_private_dns_zone.privatelink_table_core.id],
    "queues"                     = [],
    "containers"                 = [],
    "blobs_retention_days"       = 0,
  }
  subnet_id = module.subscription_snet.id

  allowed_subnets = [
    module.subscription_snet.id
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

module "subscription_fn_staging_slot" {
  source = "git::https://github.com/pagopa/terraform-azurerm-v3.git//function_app_slot?ref=v6.19.1"

  name                = "staging"
  location            = var.location
  resource_group_name = azurerm_resource_group.subscription_rg.name
  function_app_id     = module.subscription_fn.id
  app_service_plan_id = module.subscription_fn.app_service_plan_id
  health_check_path   = "/info"

  storage_account_name               = module.subscription_fn.storage_account.name
  storage_account_access_key         = module.subscription_fn.storage_account.primary_access_key
  internal_storage_connection_string = module.subscription_fn.storage_account_internal_function.primary_connection_string

  node_version                             = "20"
  always_on                                = "true"
  runtime_version                          = "~4"
  application_insights_instrumentation_key = azurerm_application_insights.ai.instrumentation_key

  app_settings = merge(
    local.subscription_app_settings,
    {},
  )

  subnet_id = module.subscription_snet.id

  allowed_subnets = [
    module.subscription_snet.id
  ]

  tags = var.tags
}

resource "azurerm_monitor_autoscale_setting" "function_subscription" {
  name                = format("%s-autoscale", module.subscription_fn.name)
  resource_group_name = azurerm_resource_group.subscription_rg.name
  location            = var.location
  target_resource_id  = module.subscription_fn.app_service_plan_id


  # Scaling strategy
  # 05 - 19,30 -> min 3
  # 19,30 - 23 -> min 4
  # 23 - 05 -> min 2
  dynamic "profile" {
    for_each = [
      {
        name = "{\"name\":\"default\",\"for\":\"evening\"}",

        recurrence = {
          hours   = 22
          minutes = 59
        }

        capacity = {
          default = var.function_subscription_config.autoscale_default + 1
          minimum = var.function_subscription_config.autoscale_minimum + 1
          maximum = var.function_subscription_config.autoscale_maximum
        }
      },
      {
        name = "{\"name\":\"default\",\"for\":\"night\"}",

        recurrence = {
          hours   = 5
          minutes = 0
        }

        capacity = {
          default = var.function_subscription_config.autoscale_default + 1
          minimum = var.function_subscription_config.autoscale_minimum + 1
          maximum = var.function_subscription_config.autoscale_maximum
        }
      },
      {
        name = "evening",

        recurrence = {
          hours   = 19
          minutes = 30
        }

        capacity = {
          default = var.function_subscription_config.autoscale_default + 2
          minimum = var.function_subscription_config.autoscale_minimum + 2
          maximum = var.function_subscription_config.autoscale_maximum
        }
      },
      {
        name = "night",

        recurrence = {
          hours   = 23
          minutes = 0
        }

        capacity = {
          default = var.function_subscription_config.autoscale_default
          minimum = var.function_subscription_config.autoscale_minimum
          maximum = var.function_subscription_config.autoscale_maximum
        }
      }
    ]
    iterator = profile_info

    content {
      name = profile_info.value.name

      dynamic "recurrence" {
        for_each = profile_info.value.recurrence != null ? [profile_info.value.recurrence] : []
        iterator = recurrence_info

        content {
          timezone = "W. Europe Standard Time"
          hours    = [recurrence_info.value.hours]
          minutes  = [recurrence_info.value.minutes]
          days = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
          ]
        }
      }

      capacity {
        default = profile_info.value.capacity.default
        minimum = profile_info.value.capacity.minimum
        maximum = profile_info.value.capacity.maximum
      }

      # Increase

      rule {
        metric_trigger {
          metric_name              = "Requests"
          metric_resource_id       = module.function_fast_login[0].id
          metric_namespace         = "microsoft.web/sites"
          time_grain               = "PT1M"
          statistic                = "Average"
          time_window              = "PT1M"
          time_aggregation         = "Average"
          operator                 = "GreaterThan"
          threshold                = 3000
          divide_by_instance_count = false
        }

        scale_action {
          direction = "Increase"
          type      = "ChangeCount"
          value     = "2"
          cooldown  = "PT1M"
        }
      }

      rule {
        metric_trigger {
          metric_name              = "CpuPercentage"
          metric_resource_id       = module.subscription_fn.app_service_plan_id
          metric_namespace         = "microsoft.web/serverfarms"
          time_grain               = "PT1M"
          statistic                = "Average"
          time_window              = "PT1M"
          time_aggregation         = "Average"
          operator                 = "GreaterThan"
          threshold                = 45
          divide_by_instance_count = false
        }

        scale_action {
          direction = "Increase"
          type      = "ChangeCount"
          value     = "2"
          cooldown  = "PT1M"
        }
      }

      # Decrease

      rule {
        metric_trigger {
          metric_name              = "Requests"
          metric_resource_id       = module.subscription_fn.id
          metric_namespace         = "microsoft.web/sites"
          time_grain               = "PT1M"
          statistic                = "Average"
          time_window              = "PT15M"
          time_aggregation         = "Average"
          operator                 = "LessThan"
          threshold                = 2000
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
          metric_resource_id       = module.subscription_fn.app_service_plan_id
          metric_namespace         = "microsoft.web/serverfarms"
          time_grain               = "PT1M"
          statistic                = "Average"
          time_window              = "PT15M"
          time_aggregation         = "Average"
          operator                 = "LessThan"
          threshold                = 30
          divide_by_instance_count = false
        }

        scale_action {
          direction = "Decrease"
          type      = "ChangeCount"
          value     = "1"
          cooldown  = "PT10M"
        }
      }
    }
  }
}