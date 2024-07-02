resource "azuredevops_serviceendpoint_github" "azure-devops-github-ro" {
  project_id            = data.azuredevops_project.project.id
  service_endpoint_name = "azure-devops-github-ro"
  auth_personal {
    personal_access_token = data.azurerm_key_vault_secret.PAT.value
  }
  lifecycle {
    ignore_changes = [description, authorization]
  }
}


data "azurerm_key_vault_secret" "PAT" {
  name         = "devops-github-service-conn-pat"
  key_vault_id = data.azurerm_key_vault.kv_prod.id
}
