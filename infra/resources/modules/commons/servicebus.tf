resource "azurerm_servicebus_namespace" "main" {
  name                = local.servicebus_namespace
  resource_group_name = azurerm_resource_group.data_rg.name
  location            = var.location
  # The premium is required to use private endpoint
  sku            = "Premium"
  zone_redundant = true

  capacity                     = 1
  premium_messaging_partitions = 1

  network_rule_set {
    default_action = "Deny"
  }

  tags = var.tags
}

# This topic is used as entry-point for publish events about
# a trial (e.g. user subscriber, user activated, etc ...)
resource "azurerm_servicebus_topic" "events" {
  name         = "${local.domain}-topic-events"
  namespace_id = azurerm_servicebus_namespace.main.id

  enable_partitioning = true
  support_ordering    = true
}
