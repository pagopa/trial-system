resource "azurerm_resource_group" "rg_external" {
  name     = format("%s-rg-external-01", local.project)
  location = var.location

  tags = var.tags
}

resource "azurerm_public_ip" "appgateway_public_ip" {
  name                = format("%s-appgateway-pip-01", local.project)
  resource_group_name = azurerm_resource_group.rg_external.name
  location            = azurerm_resource_group.rg_external.location
  sku                 = "Standard"
  allocation_method   = "Static"
  zones               = [1, 2, 3]

  tags = var.tags
}