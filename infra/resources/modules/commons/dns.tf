# Public DNS
resource "azurerm_dns_zone" "trial_pagopa_it" {
  count               = (var.dns_config == null) ? 0 : 1
  name                = join(".", [var.dns_config.external_third_level, var.dns_config.second_level])
  resource_group_name = azurerm_resource_group.net_rg.name

  tags = var.tags
}

resource "azurerm_dns_caa_record" "trial_pagopa_it" {
  name                = "@"
  zone_name           = azurerm_dns_zone.trial_pagopa_it[0].name
  resource_group_name = azurerm_resource_group.net_rg.name
  ttl                 = var.dns_config.dns_default_ttl_sec

  record {
    flags = 0
    tag   = "issue"
    value = "digicert.com"
  }

  record {
    flags = 0
    tag   = "issue"
    value = "letsencrypt.org"
  }

  record {
    flags = 0
    tag   = "iodef"
    value = "mailto:security+caa@pagopa.it"
  }

  tags = var.tags
}

resource "azurerm_dns_a_record" "api_trial_pagopa_it" {
  name                = "api"
  zone_name           = azurerm_dns_zone.trial_pagopa_it[0].name
  resource_group_name = azurerm_resource_group.net_rg.name
  ttl                 = var.dns_config.dns_default_ttl_sec
  records             = [azurerm_public_ip.appgateway_public_ip.ip_address]

  tags = var.tags
}

# Private DNS zones
# APIM
resource "azurerm_private_dns_zone" "azure_api_net" {
  name                = "azure-api.net"
  resource_group_name = azurerm_resource_group.net_rg.name

  tags = var.tags
}

resource "azurerm_private_dns_a_record" "apim_azure_api_net" {
  name                = module.apim.name
  zone_name           = azurerm_private_dns_zone.azure_api_net.name
  resource_group_name = azurerm_resource_group.net_rg.name
  ttl                 = var.dns_config.dns_default_ttl_sec
  records             = [module.apim.private_ip_addresses[0]]

  tags = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "azure_api_link" {
  name                  = azurerm_virtual_network.vnet.name
  resource_group_name   = azurerm_resource_group.net_rg.name
  private_dns_zone_name = azurerm_private_dns_zone.azure_api_net.name
  virtual_network_id    = azurerm_virtual_network.vnet.id
}

resource "azurerm_private_dns_zone" "management_azure_api_net" {
  name                = "management.azure-api.net"
  resource_group_name = azurerm_resource_group.net_rg.name

  tags = var.tags
}

resource "azurerm_private_dns_a_record" "apim_management_azure_api_net" {
  name                = module.apim.name
  zone_name           = azurerm_private_dns_zone.management_azure_api_net.name
  resource_group_name = azurerm_resource_group.net_rg.name
  ttl                 = var.dns_config.dns_default_ttl_sec
  records             = [module.apim.private_ip_addresses[0]]

  tags = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "management_api_link" {
  name                  = azurerm_virtual_network.vnet.name
  resource_group_name   = azurerm_resource_group.net_rg.name
  private_dns_zone_name = azurerm_private_dns_zone.management_azure_api_net.name
  virtual_network_id    = azurerm_virtual_network.vnet.id
}

resource "azurerm_private_dns_zone" "scm_azure_api_net" {
  name                = "scm.azure-api.net"
  resource_group_name = azurerm_resource_group.net_rg.name

  tags = var.tags
}

resource "azurerm_private_dns_a_record" "apim_scm_azure_api_net" {
  name                = module.apim.name
  zone_name           = azurerm_private_dns_zone.scm_azure_api_net.name
  resource_group_name = azurerm_resource_group.net_rg.name
  ttl                 = var.dns_config.dns_default_ttl_sec
  records             = [module.apim.private_ip_addresses[0]]

  tags = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "scm_apim_link" {
  name                  = azurerm_virtual_network.vnet.name
  resource_group_name   = azurerm_resource_group.net_rg.name
  private_dns_zone_name = azurerm_private_dns_zone.scm_azure_api_net.name
  virtual_network_id    = azurerm_virtual_network.vnet.id
}

# Storage Account
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

resource "azurerm_private_dns_zone" "privatelink_file_core" {
  name                = "privatelink.file.core.windows.net"
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

resource "azurerm_private_dns_zone_virtual_network_link" "file_core_private_vnet" {
  name                  = azurerm_virtual_network.vnet.name
  resource_group_name   = azurerm_resource_group.net_rg.name
  private_dns_zone_name = azurerm_private_dns_zone.privatelink_file_core.name
  virtual_network_id    = azurerm_virtual_network.vnet.id
  registration_enabled  = false

  tags = var.tags
}

# Cosmos
resource "azurerm_private_dns_zone" "privatelink_documents" {
  name                = "privatelink.documents.azure.com"
  resource_group_name = azurerm_resource_group.net_rg.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "cosmos_link" {
  name                  = azurerm_virtual_network.vnet.name
  resource_group_name   = azurerm_resource_group.net_rg.name
  private_dns_zone_name = azurerm_private_dns_zone.privatelink_documents.name
  virtual_network_id    = azurerm_virtual_network.vnet.id
}

# Websites
resource "azurerm_private_dns_zone" "privatelink_websites" {
  name                = "privatelink.azurewebsites.net"
  resource_group_name = azurerm_resource_group.net_rg.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "websites_link" {
  name                  = azurerm_virtual_network.vnet.name
  resource_group_name   = azurerm_resource_group.net_rg.name
  private_dns_zone_name = azurerm_private_dns_zone.privatelink_websites.name
  virtual_network_id    = azurerm_virtual_network.vnet.id
}
