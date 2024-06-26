# APIM subnet
module "apim_snet" {
  source               = "git::https://github.com/pagopa/terraform-azurerm-v3.git//subnet?ref=v8.7.0"
  name                 = format("%s-apim-snet-01", local.project)
  resource_group_name  = azurerm_virtual_network.vnet.resource_group_name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = var.apim_subnet_cidr

  private_endpoint_network_policies_enabled = true
}

resource "azurerm_network_security_group" "nsg_apim" {
  name                = format("%s-apim-nsg", local.project)
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

# ###########################
# ## Api Management (apim) ##
# ###########################
module "apim" {
  source = "git::https://github.com/pagopa/terraform-azurerm-v3.git//api_management?ref=v8.7.0"

  location                  = var.location
  name                      = format("%s-apim-01", local.project)
  resource_group_name       = azurerm_resource_group.rg_routing.name
  publisher_name            = "TRIAL"
  publisher_email           = var.apim_config.publisher_email
  notification_sender_email = var.apim_config.publisher_email
  sku_name                  = var.apim_config.sku
  virtual_network_type      = "None"

  # not used at the moment
  redis_cache_id          = null # module.redis_apim.id

  application_insights = {
    enabled             = true
    instrumentation_key = azurerm_application_insights.ai.instrumentation_key
  }

  tags = var.tags

}