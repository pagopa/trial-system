data "azurerm_virtual_network" "common" {
  name                = "${local.project}-vnet-01"
  resource_group_name = "${local.project}-net-rg-01"
}

data "azurerm_log_analytics_workspace" "log" {
  name                = "${local.project}-trial-law-01"
  resource_group_name = "${local.project}-monitor-rg-01"
}

data "azurerm_key_vault" "kv" {
  name                = "${local.project}-kv-01"
  resource_group_name = "${local.project}-sec-rg-01"
}
