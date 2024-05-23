module "event_hub" {
  source = "git::https://github.com/pagopa/terraform-azurerm-v3.git//eventhub?ref=v8.13.0"

  name                = "${local.domain}-evh"
  resource_group_name = azurerm_resource_group.data_rg.name
  location            = var.location
  sku                 = "Standard"

  eventhubs = [
    // EventHub that collects users' subscription requests
    {
      name              = "${local.domain}-subscription-requests"
      partitions        = 1
      message_retention = 7
      consumers         = []
      keys              = []
    },
  ]

  private_endpoint_created = false
  virtual_network_ids      = [azurerm_virtual_network.vnet.id]
  tags                     = var.tags
}
