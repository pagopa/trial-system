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
