module "event_hub" {
  source = "github.com/pagopa/terraform-azurerm-v3//eventhub?ref=v8.26.0"

  name                = "${local.project}-main-evhns-01"
  resource_group_name = azurerm_resource_group.data_rg.name
  location            = var.location
  sku                 = "Standard"

  eventhubs = [
    // EventHub that collects users' subscription requests
    {
      name              = local.subscription_request_eventhub_name
      partitions        = 1
      message_retention = 7
      consumers         = []
      keys              = []
    },
  ]

  alerts_enabled = true
  metric_alerts = {
    num_of_messages = {
      aggregation = "Total"
      metric_name = "IncomingMessages"
      description = "High volume of messages to ingest, potentially causing delays in sending subscription request events (~1h)."
      operator    = "GreaterThanOrEqual"
      threshold   = 100000
      frequency   = "PT5M"
      window_size = "PT15M"
      dimension   = [],
    },
    active_connections = {
      aggregation = "Average"
      metric_name = "ActiveConnections"
      description = "No connections detected, potential issues with the subscription activation feature",
      operator    = "LessThanOrEqual"
      threshold   = 0
      frequency   = "PT5M"
      window_size = "PT15M"
      dimension   = [],
    },
  }
  action = [
    {
      action_group_id    = azurerm_monitor_action_group.error_action_group.id
      webhook_properties = null
    }
  ]

  private_endpoint_created             = true
  private_endpoint_resource_group_name = azurerm_resource_group.net_rg.name
  private_endpoint_subnet_id           = module.pendpoints_snet.id
  private_dns_zones = {
    id                  = [azurerm_private_dns_zone.privatelink_servicebus.id]
    name                = [azurerm_private_dns_zone.privatelink_servicebus.name]
    resource_group_name = azurerm_private_dns_zone.privatelink_servicebus.resource_group_name
  }

  virtual_network_ids = [azurerm_virtual_network.vnet.id]
  tags                = var.tags
}
