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
