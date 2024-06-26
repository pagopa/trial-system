resource "azurerm_cosmosdb_sql_container" "subscription" {
  name                  = "subscription"
  resource_group_name   = azurerm_resource_group.data_rg.name
  account_name          = module.cosmosdb_account.name
  database_name         = module.cosmosdb_sql_database_trial.name
  partition_key_path    = "/id"
  partition_key_version = 2

  autoscale_settings {
    max_throughput = 1000
  }
}

resource "azurerm_cosmosdb_sql_container" "subscription_history" {
  name                  = "subscription-history"
  resource_group_name   = azurerm_resource_group.data_rg.name
  account_name          = module.cosmosdb_account.name
  database_name         = module.cosmosdb_sql_database_trial.name
  partition_key_path    = "/subscriptionId"
  partition_key_version = 2

  autoscale_settings {
    max_throughput = 1000
  }

  indexing_policy {
    included_path {
      path = "/*"
    }

    composite_index {
      index {
        path  = "/subscriptionId"
        order = "Ascending"
      }

      index {
        path  = "/version"
        order = "Descending"
      }
    }
  }
}

resource "azurerm_cosmosdb_sql_container" "activations" {
  name                  = "activations"
  resource_group_name   = azurerm_resource_group.data_rg.name
  account_name          = module.cosmosdb_account.name
  database_name         = module.cosmosdb_sql_database_trial.name
  partition_key_path    = "/trialId"
  partition_key_version = 2

  autoscale_settings {
    max_throughput = 1000
  }

  indexing_policy {
    included_path {
      path = "/*"
    }

    composite_index {
      index {
        path  = "/trialId"
        order = "Ascending"
      }

      index {
        path  = "/type"
        order = "Ascending"
      }

      index {
        path  = "/activated"
        order = "Ascending"
      }

      index {
        path  = "/id"
        order = "Ascending"
      }
    }
  }
}

resource "azurerm_cosmosdb_sql_container" "leases" {
  name                  = "leases"
  resource_group_name   = azurerm_resource_group.data_rg.name
  account_name          = module.cosmosdb_account.name
  database_name         = module.cosmosdb_sql_database_trial.name
  partition_key_path    = "/id"
  partition_key_version = 2

  autoscale_settings {
    max_throughput = 1000
  }

  indexing_policy {
    included_path {
      path = "/*"
    }
  }
}

resource "azurerm_cosmosdb_sql_container" "trials" {
  name                  = "trials"
  resource_group_name   = azurerm_resource_group.data_rg.name
  account_name          = module.cosmosdb_account.name
  database_name         = module.cosmosdb_sql_database_trial.name
  partition_key_path    = "/id"
  partition_key_version = 2

  autoscale_settings {
    max_throughput = 1000
  }

  indexing_policy {
    included_path {
      path = "/*"
    }
  }
}
