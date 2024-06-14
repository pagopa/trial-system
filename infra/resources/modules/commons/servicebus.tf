resource "azurerm_servicebus_namespace" "main" {
  name                = local.servicebus_namespace
  resource_group_name = azurerm_resource_group.data_rg.name
  location            = var.location
  # The premium is required to use private endpoint
  sku = "Premium"

  capacity                     = 1
  premium_messaging_partitions = 1

  tags = var.tags
}

# This topic is used as entry-point for publish events about
# a trial (e.g. user subscriber, user activated, etc ...)
resource "azurerm_servicebus_topic" "events" {
  name         = "${local.domain}-topic-events"
  namespace_id = azurerm_servicebus_namespace.main.id

  enable_partitioning = true
}
