resource "azurerm_subnet" "github_runner" {
  name                 = "${local.project}-github-runner-snet"
  resource_group_name  = data.azurerm_virtual_network.common.resource_group_name
  virtual_network_name = data.azurerm_virtual_network.common.name
  address_prefixes     = ["10.30.7.0/27"]

  delegation {
    name = "Microsoft.App/environments"
    service_delegation {
      name    = "Microsoft.App/environments"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}
