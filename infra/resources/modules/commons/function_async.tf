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

    COSMOSDB_ENDPOINT               = module.cosmosdb_account.endpoint
    COSMOSDB_DATABASE_NAME          = module.cosmosdb_sql_database_trial.name
    EVENTHUB_NAMESPACE              = module.event_hub.name
    SERVICEBUS_NAMESPACE            = azurerm_servicebus_namespace.main.name
    SERVICE_BUS_RESOURCE_GROUP_NAME = azurerm_servicebus_namespace.main.resource_group_name
    SERVICE_BUS_LOCATION            = azurerm_servicebus_namespace.main.location

    SUBSCRIPTION_ID = data.azurerm_subscription.current.subscription_id

    LEASES_COSMOSDB_CONTAINER_NAME = azurerm_cosmosdb_sql_container.leases.name

    SUBSCRIPTION_HISTORY_CONSUMER                        = "on"
    SUBSCRIPTION_HISTORY_COSMOSDB_CONTAINER_NAME         = azurerm_cosmosdb_sql_container.subscription_history.name
    SubscriptionHistoryCosmosConnection__accountEndpoint = module.cosmosdb_account.endpoint

    SUBSCRIPTION_REQUEST_CONSUMER                                  = "on"
    SUBSCRIPTION_REQUEST_EVENTHUB_NAME                             = "${local.project}-sr-evh-01"
    SubscriptionRequestEventHubConnection__fullyQualifiedNamespace = "${module.event_hub.name}.servicebus.windows.net"

    ACTIVATION_CONSUMER                                   = "on"
    ACTIVATION_MAX_FETCH_SIZE                             = "999"
    ACTIVATIONS_COSMOSDB_CONTAINER_NAME                   = azurerm_cosmosdb_sql_container.activations.name
    ActivationConsumerCosmosDBConnection__accountEndpoint = module.cosmosdb_account.endpoint

    EVENTS_PRODUCER              = "on"
    EVENTS_SERVICEBUS_TOPIC_NAME = azurerm_servicebus_topic.events.name

    TRIAL_CONSUMER                          = "on"
    TRIALS_COSMOSDB_CONTAINER_NAME          = azurerm_cosmosdb_sql_container.trials.name
    TrialsCosmosConnection__accountEndpoint = module.cosmosdb_account.endpoint
  }
}

resource "azurerm_resource_group" "async_rg" {
  name     = "${local.project}-async-rg-01"
  location = var.location

  tags = var.tags
}

module "subscription_async_fn" {
  source = "github.com/pagopa/terraform-azurerm-v3//function_app?ref=v8.26.0"

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
    {
      # Avoiding host ID collisions
      # https://learn.microsoft.com/en-us/azure/azure-functions/storage-considerations?tabs=azure-cli#avoiding-host-id-collisions
      AzureFunctionsWebHost__hostid = "subscription-async-fn-01"
    },
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

  enable_function_app_public_network_access = false

  system_identity_enabled = true

  # Action groups for alerts
  action = [
    {
      action_group_id    = azurerm_monitor_action_group.error_action_group.id
      webhook_properties = {}
    }
  ]

  tags = var.tags
}

# Enables the subscription_async_fn to write on service-bus topic
resource "azurerm_role_assignment" "subs_asyn_write_to_sbt" {
  scope                = azurerm_servicebus_topic.events.id
  role_definition_name = "Azure Service Bus Data Sender"
  principal_id         = module.subscription_async_fn.system_identity_principal
}

# Enables the subscription_async_fn to read from the event-hub
resource "azurerm_role_assignment" "subs_asyn_receive_from_evh" {
  scope                = module.event_hub.hub_ids["${local.project}-sr-evh-01"]
  role_definition_name = "Azure Event Hubs Data Receiver"
  principal_id         = module.subscription_async_fn.system_identity_principal
}

# Enables the subs_fn to read and write to cosmosdb
resource "azurerm_cosmosdb_sql_role_assignment" "subs_async_fn_to_cosmos_db" {
  scope               = "${module.cosmosdb_account.id}/dbs/${module.cosmosdb_sql_database_trial.name}"
  resource_group_name = azurerm_resource_group.data_rg.name
  account_name        = module.cosmosdb_account.name
  role_definition_id  = "${module.cosmosdb_account.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000002"
  principal_id        = module.subscription_async_fn.system_identity_principal
}

# Enables the subscription_async_fn to create user assigned identities in a resource group
resource "azurerm_role_definition" "subs_asyn_create_user_assigned_identity" {
  name  = "Create User Assigned Identity"
  scope = azurerm_resource_group.data_rg.id

  permissions {
    actions = ["Microsoft.ManagedIdentity/userAssignedIdentities/write"]
  }
}

resource "azurerm_role_assignment" "subs_asyn_create_user_assigned_identity" {
  scope              = azurerm_role_definition.subs_asyn_create_user_assigned_identity.scope
  role_definition_id = azurerm_role_definition.subs_asyn_create_user_assigned_identity.role_definition_resource_id
  principal_id       = module.subscription_async_fn.system_identity_principal
}

# Enables the subscription_async_fn to create queues in the service bus' namespace
resource "azurerm_role_definition" "subs_asyn_create_queue" {
  name  = "Service Bus Create Queue"
  scope = azurerm_servicebus_namespace.main.id

  permissions {
    actions = ["Microsoft.ServiceBus/namespaces/queues/write"]
  }
}

resource "azurerm_role_assignment" "subs_asyn_create_queue" {
  scope              = azurerm_role_definition.subs_asyn_create_queue.scope
  role_definition_id = azurerm_role_definition.subs_asyn_create_queue.role_definition_resource_id
  principal_id       = module.subscription_async_fn.system_identity_principal
}

# Enables the subscription_async_fn to create topic subscriptions
resource "azurerm_role_definition" "subs_asyn_create_subscription" {
  name  = "Service Bus Create Subscription"
  scope = azurerm_servicebus_topic.events.id

  permissions {
    actions = [
      "Microsoft.ServiceBus/namespaces/topics/subscriptions/write",
    ]
  }
}

resource "azurerm_role_assignment" "subs_asyn_create_subscription" {
  scope              = azurerm_role_definition.subs_asyn_create_subscription.scope
  role_definition_id = azurerm_role_definition.subs_asyn_create_subscription.role_definition_resource_id
  principal_id       = module.subscription_async_fn.system_identity_principal
}

# Enables the subscription_async_fn to create filters on topic subscriptions
resource "azurerm_role_definition" "subs_asyn_create_filter_rule" {
  name  = "Service Bus Create Filter Rule"
  scope = azurerm_role_definition.subs_asyn_create_subscription.scope

  permissions {
    actions = [
      "Microsoft.ServiceBus/namespaces/topics/subscriptions/rules/write"
    ]
  }
}

resource "azurerm_role_assignment" "subs_asyn_create_filter_rule" {
  scope              = azurerm_role_definition.subs_asyn_create_filter_rule.scope
  role_definition_id = azurerm_role_definition.subs_asyn_create_filter_rule.role_definition_resource_id
  principal_id       = module.subscription_async_fn.system_identity_principal
}

# Enables the subscription_async_fn to create role assignments
resource "azurerm_role_definition" "subs_asyn_create_role_assignment" {
  name  = "Service Bus Create Role Assignment"
  scope = azurerm_role_definition.subs_asyn_create_queue.scope

  permissions {
    actions = ["Microsoft.Authorization/roleAssignments/write"]
  }
}

# Enables the subscription_async_fn to create a filter rule
resource "azurerm_role_assignment" "subs_asyn_create_role_assignment" {
  scope              = azurerm_role_definition.subs_asyn_create_role_assignment.scope
  role_definition_id = azurerm_role_definition.subs_asyn_create_role_assignment.role_definition_resource_id
  principal_id       = module.subscription_async_fn.system_identity_principal
}

module "subscription_async_fn_staging_slot" {
  source = "github.com/pagopa/terraform-azurerm-v3//function_app_slot?ref=v8.26.0"

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
    {
      # Avoiding host ID collisions
      # https://learn.microsoft.com/en-us/azure/azure-functions/storage-considerations?tabs=azure-cli#avoiding-host-id-collisions
      AzureFunctionsWebHost__hostid = "subscription-async-fn-01-staging"
    },
  )

  subnet_id = module.subscription_async_snet.id

  enable_function_app_public_network_access = false

  system_identity_enabled = true

  tags = var.tags
}

# Enables the subscription_async_fn_staging to write on service-bus topic
resource "azurerm_role_assignment" "subs_asyn_staging_write_to_sbt" {
  scope                = azurerm_servicebus_topic.events.id
  role_definition_name = "Azure Service Bus Data Sender"
  principal_id         = module.subscription_async_fn_staging_slot.system_identity_principal
}

# Enables the subscription_async_fn_staging to read from the event-hub
resource "azurerm_role_assignment" "subs_asyn_staging_receive_from_evh" {
  scope                = module.event_hub.hub_ids["${local.project}-sr-evh-01"]
  role_definition_name = "Azure Event Hubs Data Receiver"
  principal_id         = module.subscription_async_fn_staging_slot.system_identity_principal
}

# Enables the subs_fn to read and write to cosmosdb
resource "azurerm_cosmosdb_sql_role_assignment" "subs_async_fn_staging_to_cosmos_db" {
  scope               = "${module.cosmosdb_account.id}/dbs/${module.cosmosdb_sql_database_trial.name}"
  resource_group_name = azurerm_resource_group.data_rg.name
  account_name        = module.cosmosdb_account.name
  role_definition_id  = "${module.cosmosdb_account.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000002"
  principal_id        = module.subscription_async_fn_staging_slot.system_identity_principal
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
