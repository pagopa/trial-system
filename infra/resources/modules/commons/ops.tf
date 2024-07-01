resource "azurerm_resource_group" "ops_rg" {
  name     = "${local.project}-ops-rg-01"
  location = var.location
  tags     = var.tags
}

resource "azurerm_storage_account" "ops_data" {
  name                     = "${local.project}opsstdata01"
  resource_group_name      = azurerm_resource_group.ops_rg.name
  location                 = azurerm_resource_group.ops_rg.location
  account_tier             = "Standard"
  account_replication_type = "ZRS"
}

resource "azurerm_storage_account" "ops" {
  name                     = "${local.project}opsst01"
  resource_group_name      = azurerm_resource_group.ops_rg.name
  location                 = azurerm_resource_group.ops_rg.location
  account_tier             = "Standard"
  account_replication_type = "ZRS"
}

resource "azurerm_app_service_plan" "lapp_sp" {
  name                =  "${local.project}-ops-lapp-plan-01"
  location            = azurerm_resource_group.ops_rg.location
  resource_group_name = azurerm_resource_group.ops_rg.name
  kind                = "elastic"


  sku {
    tier = "WorkflowStandard"
    size = "WS1"
  }
}

resource "azurerm_logic_app_standard" "lapp" {
  name                       = "${local.project}-ops-lapp-01"
  location                   = azurerm_resource_group.ops_rg.location
  resource_group_name        = azurerm_resource_group.ops_rg.name
  app_service_plan_id        = azurerm_app_service_plan.lapp_sp.id
  storage_account_name       = azurerm_storage_account.ops.name
  storage_account_access_key = azurerm_storage_account.ops.primary_access_key

  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME"     = "node"
    "WEBSITE_NODE_DEFAULT_VERSION" = "~18"

    DATA_STORAGE_CONN_STRING = azurerm_storage_account.ops_data.primary_connection_string
  }
}
