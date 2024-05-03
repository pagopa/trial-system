data "azurerm_subscription" "current" {}

data "azurerm_client_config" "current" {}

# data "azurerm_virtual_network" "vnet_common" {
#   provider = azurerm.prodio
#   name                = var.vnet_common.name
#   resource_group_name = var.vnet_common.resource_group_name
# }