data "azuredevops_project" "project" {
  name = local.project_name
}

data "azurerm_key_vault" "kv_prod" {
  name                = "ts-p-itn-kv-01"
  resource_group_name = "ts-p-itn-sec-rg-01"
}

data "azurerm_key_vault_secret" "PAT" {
  name         = "devops-github-service-conn-pat"
  key_vault_id = data.azurerm_key_vault.kv_prod.id
}
