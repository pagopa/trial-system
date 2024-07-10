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

  # not used at the moment
  redis_cache_id = null

  application_insights = {
    enabled             = true
    instrumentation_key = azurerm_application_insights.ai.instrumentation_key
  }

  tags = var.tags
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
  source = "git::https://github.com/pagopa/terraform-azurerm-v3//api_management_api?ref=v7.62.0"

  name                  = "trial-manager-api"
  api_management_name   = module.apim.name
  resource_group_name   = module.apim.resource_group_name
  product_ids           = [module.apim_product_ts_management.product_id]
  subscription_required = true
  service_url           = null

  description  = "TRIAL MANAGER API"
  display_name = "TRIAL Manager API"
  path         = "api/v1"
  protocols    = ["https"]

  content_format = "openapi"

  content_value = file("../modules/commons/api/ts_management/v1/_openapi.yaml")

  xml_content = file("../modules/commons/api/ts_management/v1/policy.xml")
}

resource "azurerm_api_management_named_value" "ts_subscription_fn_url" {
  name                = "ts-subscription-fn-url"
  api_management_name = module.apim.name
  resource_group_name = module.apim.resource_group_name
  display_name        = "ts-subscription-fn-url"
  value               = "https://${module.subscription_fn.default_hostname}"
}

data "azurerm_key_vault_secret" "ts_subscription_fn_key_secret" {
  name         = "ts-subscription-fn-key-KEY-APIM"
  key_vault_id = module.key_vault.id
}

resource "azurerm_api_management_named_value" "ts_subscription_fn_key" {
  name                = "ts-subscription-fn-key"
  api_management_name = module.apim.name
  resource_group_name = module.apim.resource_group_name
  display_name        = "ts-subscription-fn-key"
  value               = data.azurerm_key_vault_secret.ts_subscription_fn_key_secret.value
  secret              = "true"
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
