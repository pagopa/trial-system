resource "azurerm_public_ip" "apim" {
  name                = format("%s-apim-pip-01", local.project)
  resource_group_name = azurerm_resource_group.rg_routing.name
  location            = azurerm_resource_group.rg_routing.location
  sku                 = "Standard"
  allocation_method   = "Static"
  zones               = [1, 2, 3]

  domain_name_label = lower(format("%s-apim-01", local.project))

  tags = var.tags
}

module "apim" {
  source = "github.com/pagopa/terraform-azurerm-v3//api_management?ref=v8.26.0"

  location                  = var.location
  name                      = format("%s-apim-01", local.project)
  resource_group_name       = azurerm_resource_group.rg_routing.name
  publisher_name            = "TRIAL"
  publisher_email           = var.apim_config.publisher_email
  notification_sender_email = var.apim_config.publisher_email
  sku_name                  = var.apim_config.sku
  virtual_network_type      = "Internal"
  subnet_id                 = module.apim_snet.id
  diagnostic_verbosity      = "information"

  redis_cache_id = null

  zones                = [1, 2]
  public_ip_address_id = azurerm_public_ip.apim.id

  autoscale = {
    enabled                       = true
    default_instances             = 2
    minimum_instances             = 2
    maximum_instances             = 6
    scale_out_capacity_percentage = 50
    scale_out_time_window         = "PT10M"
    scale_out_value               = "2"
    scale_out_cooldown            = "PT30M"
    scale_in_capacity_percentage  = 15
    scale_in_time_window          = "PT30M"
    scale_in_value                = "2"
    scale_in_cooldown             = "PT15M"
  }

  application_insights = {
    enabled             = true
    instrumentation_key = azurerm_application_insights.ai.instrumentation_key
  }

  tags = var.tags
}

# Diagnostic settings
resource "azurerm_monitor_diagnostic_setting" "apim" {
  name                           = "APIMLogs"
  target_resource_id             = module.apim.id
  log_analytics_workspace_id     = azurerm_log_analytics_workspace.law.id
  log_analytics_destination_type = "AzureDiagnostics"

  enabled_log {
    category = "GatewayLogs"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

module "apim_key_vault_access_policy" {
  source       = "github.com/pagopa/dx//infra/modules/azure_role_assignments?ref=64bece38e810e3744a142345f985ac2f279b93a9"
  principal_id = module.apim.principal_id

  key_vault = [
    {
      name                = module.key_vault.name
      resource_group_name = module.key_vault.resource_group_name
      roles = {
        secrets = "reader"
      }
    }
  ]
}

module "apim_product_ts_management" {
  source = "github.com/pagopa/terraform-azurerm-v3//api_management_product?ref=v8.26.0"

  product_id   = "ts-manager-api"
  display_name = "TRIAL SYSTEM MANAGEMENT API"
  description  = "Product for Trial system managers"

  api_management_name = module.apim.name
  resource_group_name = module.apim.resource_group_name

  published             = true
  subscription_required = true
  approval_required     = false

  policy_xml = file("../modules/commons/api_product/ts_management/_base_policy.xml")
}

module "apim_trial_manager_api_v1" {
  source = "github.com/pagopa/terraform-azurerm-v3//api_management_api?ref=v8.26.0"

  name                  = "trial-manager-api"
  api_management_name   = module.apim.name
  resource_group_name   = module.apim.resource_group_name
  product_ids           = [module.apim_product_ts_management.product_id]
  subscription_required = true
  service_url           = null

  description  = "TRIAL MANAGER API"
  display_name = "TRIAL Manager API"
  path         = "manage/api/v1"
  protocols    = ["https"]

  content_format = "openapi"

  content_value = file("../modules/commons/api/ts_management/v1/_openapi.yaml")

  xml_content = file("../modules/commons/api/ts_management/v1/policy.xml")
}

data "azurerm_key_vault_secret" "ts_api_fn_key_secret" {
  name         = "ts-api-fn-key-KEY-APIM"
  key_vault_id = module.key_vault.id
}

resource "azurerm_api_management_named_value" "ts_api_fn_key" {
  name                = "ts-api-fn-key"
  api_management_name = module.apim.name
  resource_group_name = module.apim.resource_group_name
  display_name        = "ts-api-fn-key"
  secret              = true
  value_from_key_vault {
    secret_id = data.azurerm_key_vault_secret.ts_api_fn_key_secret.versionless_id
  }
}

resource "azurerm_api_management_named_value" "ts_api_fn_url" {
  name                = "ts-api-fn-url"
  api_management_name = module.apim.name
  resource_group_name = module.apim.resource_group_name
  display_name        = "ts-api-fn-url"
  value               = "https://${module.func_api.function_app.function_app.default_hostname}"
}

####################################################################################
# TRIAL MANAGERS GROUPS
####################################################################################
resource "azurerm_api_management_group" "api_trial_manager" {
  name                = "apitrialmanager"
  api_management_name = module.apim.name
  resource_group_name = module.apim.resource_group_name
  display_name        = "ApiTrialManager"
  description         = "A group that enables Trial Managers to mange its own trials"
}

resource "azurerm_api_management_group" "api_trial_user" {
  name                = "apitrialuser"
  api_management_name = module.apim.name
  resource_group_name = module.apim.resource_group_name
  display_name        = "ApiTrialUser"
  description         = "A group that enables users to manage their trial subscriptions"
}

resource "azurerm_api_management_group" "api_trial_support" {
  name                = "apitrialsupport"
  api_management_name = module.apim.name
  resource_group_name = module.apim.resource_group_name
  display_name        = "ApiTrialSupport"
  description         = "A group for customer support"
}

####################################################################################
# IO Wallet User
####################################################################################
resource "azurerm_api_management_user" "wallet_user" {
  user_id             = "iowalletuser"
  api_management_name = module.apim.name
  resource_group_name = module.apim.resource_group_name
  first_name          = "Wallet"
  last_name           = "PagoPA"
  email               = "io-wallet-pagopa@pagopa.it"
  state               = "active"
}

resource "azurerm_api_management_group_user" "wallet_manager_group" {
  user_id             = azurerm_api_management_user.wallet_user.user_id
  api_management_name = module.apim.name
  resource_group_name = module.apim.resource_group_name
  group_name          = azurerm_api_management_group.api_trial_manager.name
}

resource "azurerm_api_management_subscription" "wallet" {
  user_id             = azurerm_api_management_user.wallet_user.id
  api_management_name = module.apim.name
  resource_group_name = module.apim.resource_group_name
  product_id          = module.apim_product_ts_management.id
  display_name        = "WALLET TRIAL MANAGER API"
  state               = "active"
  allow_tracing       = false
}

####################################################################################
# Test User - Used for test purposes
####################################################################################
resource "azurerm_api_management_user" "test" {
  user_id             = "test-user"
  api_management_name = module.apim.name
  resource_group_name = module.apim.resource_group_name
  first_name          = "Test"
  last_name           = "PagoPA"
  email               = "trialsystem-tech@pagopa.it"
  state               = "active"
}

resource "azurerm_api_management_group_user" "test" {
  user_id             = azurerm_api_management_user.test.user_id
  api_management_name = module.apim.name
  resource_group_name = module.apim.resource_group_name
  group_name          = azurerm_api_management_group.api_trial_manager.name
}

resource "azurerm_api_management_subscription" "test" {
  user_id             = azurerm_api_management_user.test.id
  api_management_name = module.apim.name
  resource_group_name = module.apim.resource_group_name
  product_id          = module.apim_product_ts_management.id
  display_name        = "TEST TRIAL MANAGER API"
  state               = "active"
  allow_tracing       = false
}

####################################################################################
# IO Backend
####################################################################################
resource "azurerm_api_management_user" "io_backend" {
  user_id             = "io-backend"
  api_management_name = module.apim.name
  resource_group_name = module.apim.resource_group_name
  first_name          = "IO"
  last_name           = "Backend"
  email               = "io-platform@pagopa.it"
  state               = "active"
}

resource "azurerm_api_management_group_user" "io_user_group" {
  user_id             = azurerm_api_management_user.io_backend.user_id
  api_management_name = module.apim.name
  resource_group_name = module.apim.resource_group_name
  group_name          = azurerm_api_management_group.api_trial_user.name
}

resource "azurerm_api_management_subscription" "io_backend" {
  api_management_name = module.apim.name
  product_id          = module.apim_product_ts_management.id
  user_id             = azurerm_api_management_user.io_backend.id
  resource_group_name = module.apim.resource_group_name
  display_name        = "IO Backend"
  state               = "active"
  allow_tracing       = false
}

####################################################################################
# Support User
####################################################################################
resource "azurerm_api_management_user" "support" {
  user_id             = "support-user"
  api_management_name = module.apim.name
  resource_group_name = module.apim.resource_group_name
  first_name          = "Support"
  last_name           = "PagoPA"
  email               = "trialsystem-support@pagopa.it"
  state               = "active"
}

resource "azurerm_api_management_group_user" "support" {
  user_id             = azurerm_api_management_user.support.user_id
  api_management_name = module.apim.name
  resource_group_name = module.apim.resource_group_name
  group_name          = azurerm_api_management_group.api_trial_support.name
}

resource "azurerm_api_management_subscription" "support" {
  user_id             = azurerm_api_management_user.support.id
  api_management_name = module.apim.name
  resource_group_name = module.apim.resource_group_name
  product_id          = module.apim_product_ts_management.id
  display_name        = "PagoPA Support"
  state               = "active"
  allow_tracing       = false
}

####################################################################################
# BACKUP
####################################################################################

module "storage_account" {
  source = "github.com/pagopa/dx//infra/modules/azure_storage_account?ref=main"

  environment = {
    prefix          = var.prefix
    env_short       = var.env_short
    location        = var.location
    app_name        = "backup"
    instance_number = "01"
  }

  tier        = "s"
  access_tier = "Cool"

  resource_group_name = azurerm_resource_group.rg_routing.name

  subnet_pep_id                        = module.pendpoints_snet.id
  private_dns_zone_resource_group_name = azurerm_resource_group.net_rg.name
  force_public_network_access_enabled  = false

  network_rules = {
    default_action             = "Deny"
    bypass                     = []
    ip_rules                   = []
    virtual_network_subnet_ids = []
  }

  subservices_enabled = {
    blob  = false
    file  = false
    queue = false
    table = false
  }

  tags = var.tags
}

resource "azurerm_storage_container" "backup" {
  name                  = "apim-backup"
  storage_account_name  = module.storage_account.name
  container_access_type = "private"
}