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

  tags = var.tags
}

resource "azurerm_private_dns_zone" "privatelink_blob_core" {
  name                = "privatelink.blob.core.windows.net"
  resource_group_name = azurerm_resource_group.net_rg.name

  tags = var.tags
}

resource "azurerm_private_dns_zone" "privatelink_queue_core" {
  name                = "privatelink.queue.core.windows.net"
  resource_group_name = azurerm_resource_group.net_rg.name

  tags = var.tags
}

resource "azurerm_private_dns_zone" "privatelink_table_core" {
  name                = "privatelink.table.core.windows.net"
  resource_group_name = azurerm_resource_group.net_rg.name

  tags = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "blob_core_private_vnet" {
  name                  = azurerm_virtual_network.vnet.name
  resource_group_name   = azurerm_resource_group.net_rg.name
  private_dns_zone_name = azurerm_private_dns_zone.privatelink_blob_core.name
  virtual_network_id    = azurerm_virtual_network.vnet.id
  registration_enabled  = false

  tags = var.tags
}
resource "azurerm_private_dns_zone_virtual_network_link" "queue_core_private_vnet" {
  name                  = azurerm_virtual_network.vnet.name
  resource_group_name   = azurerm_resource_group.net_rg.name
  private_dns_zone_name = azurerm_private_dns_zone.privatelink_queue_core.name
  virtual_network_id    = azurerm_virtual_network.vnet.id
  registration_enabled  = false

  tags = var.tags
}
resource "azurerm_private_dns_zone_virtual_network_link" "table_core_private_vnet" {
  name                  = azurerm_virtual_network.vnet.name
  resource_group_name   = azurerm_resource_group.net_rg.name
  private_dns_zone_name = azurerm_private_dns_zone.privatelink_table_core.name
  virtual_network_id    = azurerm_virtual_network.vnet.id
  registration_enabled  = false

  tags = var.tags
}

resource "azurerm_private_dns_zone" "privatelink_documents" {
  name                = "privatelink.documents.azure.com"
  resource_group_name = azurerm_resource_group.net_rg.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "link" {
  name                  = azurerm_virtual_network.vnet.name
  resource_group_name   = azurerm_resource_group.net_rg.name
  private_dns_zone_name = azurerm_private_dns_zone.privatelink_documents.name
  virtual_network_id    = azurerm_virtual_network.vnet.id
}

#
# Private endpoints
#

module "pendpoints_snet" {
  source               = "github.com/pagopa/terraform-azurerm-v3.git//subnet?ref=v8.7.0"
  name                 = "${local.project}-pendpoints-snet-01"
  address_prefixes     = var.snet_pendpoints_address_space
  resource_group_name  = azurerm_resource_group.net_rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name

  private_endpoint_network_policies_enabled = false

}

resource "azurerm_private_endpoint" "sql" {
  name                = format("%s-private-endpoint-sql-01", local.project)
  location            = var.location
  resource_group_name = azurerm_resource_group.net_rg.name
  subnet_id           = module.pendpoints_snet.id

  private_service_connection {
    name                           = format("%s-private-endpoint-sql", local.project)
    private_connection_resource_id = module.cosmosdb_account.id
    is_manual_connection           = false
    subresource_names              = ["Sql"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.privatelink_documents.id]
  }
}

resource "azurerm_private_dns_zone" "privatelink_azure_websites" {
  name                = "privatelink.azurewebsites.net"
  resource_group_name = azurerm_resource_group.net_rg.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "websites_link" {
  name                  = azurerm_virtual_network.vnet.name
  resource_group_name   = azurerm_resource_group.net_rg.name
  private_dns_zone_name = azurerm_private_dns_zone.privatelink_azure_websites.name
  virtual_network_id    = azurerm_virtual_network.vnet.id
}

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

resource "azurerm_private_endpoint" "subscription_fn" {
  name                = "${local.project}-subscription-fn-endpoint"
  location            = var.location
  resource_group_name = azurerm_resource_group.net_rg.name
  subnet_id           = module.pendpoints_snet.id

  private_service_connection {
    name                           = "${local.project}-subscription-fn-endpoint"
    private_connection_resource_id = module.subscription_fn.id
    is_manual_connection           = false
    subresource_names              = ["sites"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.privatelink_azure_websites.id]
  }

  tags = var.tags
}

resource "azurerm_private_endpoint" "subscription_fn_staging" {
  name                = "${local.project}-subscription-fn-staging-endpoint"
  location            = var.location
  resource_group_name = azurerm_resource_group.net_rg.name
  subnet_id           = module.pendpoints_snet.id

  private_service_connection {
    name                           = "${local.project}-subscription-fn-staging-endpoint"
    private_connection_resource_id = module.subscription_fn.id
    is_manual_connection           = false
    subresource_names              = ["sites-${module.subscription_fn_staging_slot.name}"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.privatelink_azure_websites.id]
  }

  tags = var.tags
}

##################################################
## VNET Peering
#################################################

resource "azurerm_virtual_network_peering" "vnet_to_vnet_common" {
  name                      = format("%s-to-%s", azurerm_virtual_network.vnet.name, var.vnet_common.name)
  resource_group_name       = azurerm_resource_group.net_rg.name
  virtual_network_name      = azurerm_virtual_network.vnet.name
  remote_virtual_network_id = var.vnet_common.id

  allow_virtual_network_access = true
  allow_forwarded_traffic      = false
  allow_gateway_transit        = false
  use_remote_gateways          = false
}

resource "azurerm_virtual_network_peering" "vnet_common_to_vnet" {
  provider                  = azurerm.prodio
  name                      = format("%s-to-%s", var.vnet_common.name, azurerm_virtual_network.vnet.name)
  resource_group_name       = var.vnet_common.resource_group_name
  virtual_network_name      = var.vnet_common.name
  remote_virtual_network_id = azurerm_virtual_network.vnet.id

  allow_virtual_network_access = true
  allow_forwarded_traffic      = false
  allow_gateway_transit        = false
  use_remote_gateways          = false
}
