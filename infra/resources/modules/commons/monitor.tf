resource "azurerm_resource_group" "monitor_rg" {
    name     = "${local.project}-monitor-rg-01"
    location = var.location
    tags = var.tags
}

data "azurerm_key_vault_secret" "alert_error_notification_slack" {
  name         = "alert-error-notification-slack"
  key_vault_id = module.key_vault.id
}

resource "azurerm_monitor_action_group" "error_action_group" {
  resource_group_name = azurerm_resource_group.monitor_rg.name
  name                = "${var.prefix}${var.env_short}error01"
  short_name          = "${var.prefix}${var.env_short}error01"

  email_receiver {
    name                    = "slack"
    email_address           = data.azurerm_key_vault_secret.alert_error_notification_slack.value
    use_common_alert_schema = true
  }

  tags = var.tags
}