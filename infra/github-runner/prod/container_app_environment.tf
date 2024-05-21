resource "azurerm_container_app_environment" "github_runner" {
  name                = "${local.project}-runner-cae-01"
  location            = local.location
  resource_group_name = azurerm_resource_group.github_runner.name

  log_analytics_workspace_id = data.azurerm_log_analytics_workspace.log.id

  infrastructure_subnet_id       = azurerm_subnet.github_runner.id
  zone_redundancy_enabled        = false
  internal_load_balancer_enabled = true

  workload_profile {
    name                  = "Consumption"
    workload_profile_type = "Consumption"
    minimum_count         = 0
    maximum_count         = 0
  }

  tags = local.tags
}

resource "azurerm_management_lock" "cae" {
  lock_level = "CanNotDelete"
  name       = azurerm_container_app_environment.github_runner.name
  notes      = "This Container App Environment cannot be deleted"
  scope      = azurerm_container_app_environment.github_runner.id
}
