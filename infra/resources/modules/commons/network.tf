resource "azurerm_resource_group" "net_rg" {
  name     = "${local.project}-net-rg-01"
  location = var.location
  tags     = var.tags
}

resource "azurerm_virtual_network" "vnet" {
  name                = "${local.project}-vnet-01"
  address_space       = var.vnet_address_space
  resource_group_name = azurerm_resource_group.net_rg.name
  location            = azurerm_resource_group.net_rg.location

  ddos_protection_plan {
    enable = true
    id     = "/subscriptions/0da48c97-355f-4050-a520-f11a18b8be90/resourceGroups/sec-p-ddos/providers/Microsoft.Network/ddosProtectionPlans/sec-p-ddos-protection"
  }

  tags = var.tags
}

#
# Private endpoints
#

resource "azurerm_private_dns_zone" "privatelink_servicebus" {
  name                = "privatelink.servicebus.windows.net"
  resource_group_name = azurerm_resource_group.net_rg.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "evh_link" {
  name                  = azurerm_virtual_network.vnet.name
  resource_group_name   = azurerm_resource_group.net_rg.name
  private_dns_zone_name = azurerm_private_dns_zone.privatelink_servicebus.name
  virtual_network_id    = azurerm_virtual_network.vnet.id
}

resource "azurerm_private_endpoint" "servicebus" {
  name                = "${local.project}-sbns-pep-01"
  location            = var.location
  resource_group_name = azurerm_resource_group.net_rg.name
  subnet_id           = module.pendpoints_snet.id

  private_service_connection {
    name                           = "${local.project}-sbns-pep-01"
    private_connection_resource_id = azurerm_servicebus_namespace.main.id
    is_manual_connection           = false
    subresource_names              = ["namespace"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.privatelink_servicebus.id]
  }
}

##################################################
## VNET Peering WEU
#################################################

resource "azurerm_virtual_network_peering" "vnet_to_vnet_common" {
  name                      = format("%s-to-%s", azurerm_virtual_network.vnet.name, var.vnet_common.weu.name)
  resource_group_name       = azurerm_resource_group.net_rg.name
  virtual_network_name      = azurerm_virtual_network.vnet.name
  remote_virtual_network_id = var.vnet_common.weu.id

  allow_virtual_network_access = true
  allow_forwarded_traffic      = false
  allow_gateway_transit        = false
  use_remote_gateways          = false
}

resource "azurerm_virtual_network_peering" "vnet_common_to_vnet" {
  provider                  = azurerm.prodio
  name                      = format("%s-to-%s", var.vnet_common.weu.name, azurerm_virtual_network.vnet.name)
  resource_group_name       = var.vnet_common.weu.resource_group_name
  virtual_network_name      = var.vnet_common.weu.name
  remote_virtual_network_id = azurerm_virtual_network.vnet.id

  allow_virtual_network_access = true
  allow_forwarded_traffic      = false
  allow_gateway_transit        = false
  use_remote_gateways          = false
}

##################################################
## VNET Peering ITN
#################################################

resource "azurerm_virtual_network_peering" "vnet_to_vnet_itn_common" {
  name                      = format("%s-to-%s", azurerm_virtual_network.vnet.name, var.vnet_common.itn.name)
  resource_group_name       = azurerm_resource_group.net_rg.name
  virtual_network_name      = azurerm_virtual_network.vnet.name
  remote_virtual_network_id = var.vnet_common.itn.id

  allow_virtual_network_access = true
  allow_forwarded_traffic      = false
  allow_gateway_transit        = false
  use_remote_gateways          = false
}

resource "azurerm_virtual_network_peering" "vnet_itn_common_to_vnet" {
  provider                  = azurerm.prodio
  name                      = format("%s-to-%s", var.vnet_common.itn.name, azurerm_virtual_network.vnet.name)
  resource_group_name       = var.vnet_common.itn.resource_group_name
  virtual_network_name      = var.vnet_common.itn.name
  remote_virtual_network_id = azurerm_virtual_network.vnet.id

  allow_virtual_network_access = true
  allow_forwarded_traffic      = false
  allow_gateway_transit        = false
  use_remote_gateways          = false
}
