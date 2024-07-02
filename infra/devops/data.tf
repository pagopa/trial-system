data "azurerm_key_vault" "kv_prod" {
  name                = "ts-p-itn-kv-01"
  resource_group_name = "ts-p-itn-sec-rg-01"
}

data "azuredevops_project" "project" {
  name = local.project_name
}
