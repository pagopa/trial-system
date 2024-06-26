resource "azurerm_resource_group" "rg_routing" {
  name     = format("%s-routing-rg-01", local.project)
  location = var.location

  tags = var.tags
}

resource "azurerm_public_ip" "appgateway_public_ip" {
  name                = format("%s-appgateway-pip-01", local.project)
  resource_group_name = azurerm_resource_group.rg_routing.name
  location            = azurerm_resource_group.rg_routing.location
  sku                 = "Standard"
  allocation_method   = "Static"
  zones               = [1, 2, 3]

  tags = var.tags
}