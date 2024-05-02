
resource "azurerm_log_analytics_workspace" "law" {
  name = "${local.project}-trial-law-01"
  location = var.location
  resource_group_name = azurerm_resource_group.monitor_rg.name
  sku = "PerGB2018"
  retention_in_days = 30
}

resource "azurerm_application_insights" "ai" {
  name                = "${local.project}-trial-ai-01"
  location            = var.location
  resource_group_name = azurerm_resource_group.monitor_rg.name
  application_type    = "other"

  workspace_id = azurerm_log_analytics_workspace.law.id
}