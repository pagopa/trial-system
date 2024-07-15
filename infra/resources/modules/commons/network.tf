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

resource "azurerm_private_dns_zone_virtual_network_link" "azure_api_link" {
  name                  = azurerm_virtual_network.vnet.name
  resource_group_name   = azurerm_resource_group.net_rg.name
  private_dns_zone_name = azurerm_private_dns_zone.azure_api_net.name
  virtual_network_id    = azurerm_virtual_network.vnet.id
}


resource "azurerm_private_dns_zone_virtual_network_link" "management_api_link" {
  name                  = azurerm_virtual_network.vnet.name
  resource_group_name   = azurerm_resource_group.net_rg.name
  private_dns_zone_name = azurerm_private_dns_zone.management_azure_api_net.name
  virtual_network_id    = azurerm_virtual_network.vnet.id
}

resource "azurerm_private_dns_zone_virtual_network_link" "scm_apim_link" {
  name                  = azurerm_virtual_network.vnet.name
  resource_group_name   = azurerm_resource_group.net_rg.name
  private_dns_zone_name = azurerm_private_dns_zone.scm_azure_api_net.name
  virtual_network_id    = azurerm_virtual_network.vnet.id
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

data "azurerm_private_dns_zone" "privatelink_azure_websites" {
  provider            = azurerm.prodio
  name                = "privatelink.azurewebsites.net"
  resource_group_name = var.vnet_common.resource_group_name
}

resource "azurerm_private_dns_zone_virtual_network_link" "websites_link" {
  provider              = azurerm.prodio
  name                  = azurerm_virtual_network.vnet.name
  resource_group_name   = var.vnet_common.resource_group_name
  private_dns_zone_name = data.azurerm_private_dns_zone.privatelink_azure_websites.name
  virtual_network_id    = azurerm_virtual_network.vnet.id
}

resource "azurerm_private_endpoint" "subscription_fn" {
  name                = "${local.project}-subscription-fn-pep-01"
  location            = var.location
  resource_group_name = azurerm_resource_group.net_rg.name
  subnet_id           = module.pendpoints_snet.id

  private_service_connection {
    name                           = "${local.project}-subscription-fn-pep-01"
    private_connection_resource_id = module.subscription_fn.id
    is_manual_connection           = false
    subresource_names              = ["sites"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [data.azurerm_private_dns_zone.privatelink_azure_websites.id]
  }

  tags = var.tags
}

resource "azurerm_private_endpoint" "subscription_fn_staging" {
  name                = "${local.project}-subscription-fn-staging-pep-01"
  location            = var.location
  resource_group_name = azurerm_resource_group.net_rg.name
  subnet_id           = module.pendpoints_snet.id

  private_service_connection {
    name                           = "${local.project}-subscription-fn-staging-pep-01"
    private_connection_resource_id = module.subscription_fn.id
    is_manual_connection           = false
    subresource_names              = ["sites-${module.subscription_fn_staging_slot.name}"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [data.azurerm_private_dns_zone.privatelink_azure_websites.id]
  }

  tags = var.tags
}

resource "azurerm_private_endpoint" "subscription_async_fn_staging" {
  name                = "${local.project}-subscription-async-fn-staging-pep-01"
  location            = var.location
  resource_group_name = azurerm_resource_group.net_rg.name
  subnet_id           = module.pendpoints_snet.id

  private_service_connection {
    name                           = "${local.project}-subscription-async-fn-staging-pep-01"
    private_connection_resource_id = module.subscription_async_fn.id
    is_manual_connection           = false
    subresource_names              = ["sites-${module.subscription_async_fn_staging_slot.name}"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [data.azurerm_private_dns_zone.privatelink_azure_websites.id]
  }

  tags = var.tags
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
