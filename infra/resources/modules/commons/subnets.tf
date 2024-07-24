module "pendpoints_snet" {
  source               = "github.com/pagopa/terraform-azurerm-v3//subnet?ref=v8.26.0"
  name                 = "${local.project}-pendpoints-snet-01"
  address_prefixes     = var.snet_pendpoints_address_space
  resource_group_name  = azurerm_resource_group.net_rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name

  private_endpoint_network_policies_enabled = false
}

module "apim_snet" {
  source               = "github.com/pagopa/terraform-azurerm-v3//subnet?ref=v8.26.0"
  name                 = format("%s-apim-snet-01", local.project)
  resource_group_name  = azurerm_virtual_network.vnet.resource_group_name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = var.cidr_subnet_apim

  private_endpoint_network_policies_enabled = true

  service_endpoints = [
    "Microsoft.Web",
  ]
}

resource "azurerm_network_security_group" "nsg_apim" {
  name                = format("%s-apim-nsg-01", local.project)
  resource_group_name = azurerm_resource_group.rg_routing.name
  location            = var.location

  security_rule {
    name                       = "managementapim"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "3443"
    source_address_prefix      = "ApiManagement"
    destination_address_prefix = "VirtualNetwork"
  }

  tags = var.tags
}

resource "azurerm_subnet_network_security_group_association" "snet_nsg" {
  subnet_id                 = module.apim_snet.id
  network_security_group_id = azurerm_network_security_group.nsg_apim.id
}

module "subscription_async_snet" {
  source                                    = "github.com/pagopa/terraform-azurerm-v3//subnet?ref=v8.26.0"
  name                                      = format("%s-subscription-async-snet-01", local.project)
  address_prefixes                          = var.cidr_subnet_fnsubscriptionasync
  resource_group_name                       = azurerm_virtual_network.vnet.resource_group_name
  virtual_network_name                      = azurerm_virtual_network.vnet.name
  private_endpoint_network_policies_enabled = false

  service_endpoints = [
    "Microsoft.Web",
    "Microsoft.AzureCosmosDB",
    "Microsoft.Storage",
  ]

  delegation = {
    name = "default"
    service_delegation = {
      name    = "Microsoft.Web/serverFarms"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
}
