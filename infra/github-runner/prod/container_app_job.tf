module "container_app_job" {
  source = "github.com/pagopa/dx//infra/modules/github_selfhosted_runner_on_container_app_jobs?ref=main"

  prefix    = local.prefix
  env_short = local.env_short

  key_vault = {
    resource_group_name = data.azurerm_key_vault.kv.resource_group_name
    name                = data.azurerm_key_vault.kv.name
  }

  container_app_environment = {
    name                = azurerm_container_app_environment.github_runner.name
    resource_group_name = azurerm_container_app_environment.github_runner.resource_group_name
  }

  repo_name              = "trial-system"
  container_app_job_name = "trial-system"

  tags = local.tags
}
