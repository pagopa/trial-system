resource "azurerm_servicebus_namespace" "main" {
  name                = "${local.project}-events-sbns-01"
  resource_group_name = azurerm_resource_group.data_rg.name
  location            = var.location
  # The premium is required to use private endpoint
  sku            = "Premium"
  zone_redundant = true

  capacity                     = 1
  premium_messaging_partitions = 1

  public_network_access_enabled = false
  network_rule_set {
    default_action                = "Deny"
    public_network_access_enabled = false
  }

  tags = var.tags
}

# This topic is used as entry-point for publish events about
# a trial (e.g. user subscriber, user activated, etc ...)
resource "azurerm_servicebus_topic" "events" {
  name         = "${local.project}-events-sbt-01"
  namespace_id = azurerm_servicebus_namespace.main.id

  support_ordering = true
}
