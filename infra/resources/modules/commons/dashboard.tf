resource "azurerm_resource_group" "dashboard" {
  name     = "${local.project}-dashboards-rg-01"
  location = var.location
  tags     = var.tags
}

resource "azurerm_dashboard" "main" {
  name                = "Main"
  resource_group_name = azurerm_resource_group.dashboard.name
  location            = var.location

  dashboard_properties = templatefile("${path.module}/../../data/dashboard.tpl",
    {
      title : "Main",
      # Hardcoded because it's tracked in a different terraform state
      io_app_gateway : "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-external/providers/Microsoft.Network/applicationGateways/io-p-appgateway",
      app_gateway : module.app_gw.id,
      apim : module.apim.id,
      cosmosdb_account : module.cosmosdb_account.id,
      db_name : module.cosmosdb_sql_database_trial.name,
      subscription_container_name : azurerm_cosmosdb_sql_container.subscription.name,
      activations_container_name : azurerm_cosmosdb_sql_container.activations.name,
      api_service_plan : module.func_api.function_app.plan.id,
      consumers_service_plan : module.func_consumers.function_app.plan.id,
      servicebus_namespace : azurerm_servicebus_namespace.main.id,
      eventhub_namespace : module.event_hub.namespace_id,
      application_insights : azurerm_application_insights.ai.id
  })
}
