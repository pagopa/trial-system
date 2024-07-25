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
    default_action                = "Allow"
    public_network_access_enabled = false
    trusted_services_allowed      = true
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

resource "azurerm_monitor_autoscale_setting" "service_bus" {
  name                = "${local.project}-events-sbns-as-01"
  resource_group_name = azurerm_resource_group.data_rg.name
  location            = var.location
  target_resource_id  = azurerm_servicebus_namespace.main.id

  profile {
    name = "default"

    capacity {
      default = 1
      minimum = 1
      maximum = 2
    }

    rule {
      metric_trigger {
        metric_name              = "NamespaceCpuUsage"
        metric_resource_id       = azurerm_servicebus_namespace.main.id
        metric_namespace         = "microsoft.servicebus/namespaces"
        time_grain               = "PT1M"
        statistic                = "Average"
        time_window              = "PT5M"
        time_aggregation         = "Average"
        operator                 = "GreaterThan"
        threshold                = 70
        divide_by_instance_count = false
      }

      scale_action {
        direction = "Increase"
        type      = "ServiceAllowedNextValue"
        value     = "1"
        cooldown  = "PT2M"
      }
    }

    rule {
      metric_trigger {
        metric_name              = "NamespaceCpuUsage"
        metric_resource_id       = azurerm_servicebus_namespace.main.id
        metric_namespace         = "microsoft.servicebus/namespaces"
        time_grain               = "PT1M"
        statistic                = "Average"
        time_window              = "PT5M"
        time_aggregation         = "Average"
        operator                 = "LessThan"
        threshold                = 20
        divide_by_instance_count = false
      }

      scale_action {
        direction = "Decrease"
        type      = "ServiceAllowedNextValue"
        value     = "1"
        cooldown  = "PT3M"
      }
    }
  }
}
