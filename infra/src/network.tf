resource "azurerm_resource_group" "net_rg" {
    name     = "${local.project}-net-rg"
    location = var.location
    tags = var.tags
}

resource "azurerm_virtual_network" "vnet" {
  name                = "${local.project}-vnet"
  address_space       = var.vnet_address_space
  resource_group_name = azurerm_resource_group.net_rg.name
  location            = azurerm_resource_group.net_rg.location

  tags = var.tags
}

#
# Private endpoints
#

module "pendpoints_snet" {
  source               = "github.com/pagopa/terraform-azurerm-v3.git//subnet?ref=v7.77.0"
  name                 = "${local.project}-pendpoints-snet"
  address_prefixes     = var.snet_pendpoints_address_spaces
  resource_group_name  = azurerm_resource_group.net_rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name

  private_endpoint_network_policies_enabled     = false
  
}

resource "azurerm_private_dns_zone" "privatelink_documents" {
  name                = "privatelink.documents.azure.com"
  resource_group_name = azurerm_resource_group.net_rg.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "link" {
  name                  = azurerm_virtual_network.vnet.name
  resource_group_name = azurerm_resource_group.net_rg.name
  private_dns_zone_name = azurerm_private_dns_zone.privatelink_documents.name
  virtual_network_id    = azurerm_virtual_network.vnet.id
}

resource "azurerm_private_endpoint" "sql" {

  name                = format("%s-private-endpoint-sql", local.project)
  location            = var.location
  resource_group_name = azurerm_resource_group.net_rg.name
  subnet_id           = module.pendpoints_snet.id

  private_service_connection {
    name                           = format("%s-private-endpoint-sql", local.project)
    private_connection_resource_id = azurerm_cosmosdb_account.cosmos_account.id
    is_manual_connection           = false
    subresource_names              = ["Sql"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.privatelink_documents.id]
  }
}

##################################################
## VNET Peering
#################################################

data "azurerm_virtual_network" "vnet_common" {
  name                = var.vnet_common.name
  resource_group_name = var.vnet_common.resource_group_name
}

module "vnet_peering_common" {
  source = "git::https://github.com/pagopa/terraform-azurerm-v3.git//virtual_network_peering?ref=v7.61.0"

  source_resource_group_name       = azurerm_resource_group.net_rg.name
  source_virtual_network_name      = azurerm_virtual_network.vnet.name
  source_remote_virtual_network_id = azurerm_virtual_network.vnet.id
  source_allow_gateway_transit     = false # needed by vpn gateway for enabling routing from vnet to vnet_integration
  target_resource_group_name       = var.vnet_common.resource_group_name
  target_virtual_network_name      = data.azurerm_virtual_network.vnet_common.name
  target_remote_virtual_network_id = data.azurerm_virtual_network.vnet_common.id
  target_use_remote_gateways       = false # needed by vpn gateway for enabling routing from vnet to vnet_integration
}