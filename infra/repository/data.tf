data "azurerm_user_assigned_identity" "identity_prod_ci" {
  name                = "ts-p-trial-system-github-ci-identity"
  resource_group_name = local.identity_resource_group_name
}

data "azurerm_user_assigned_identity" "identity_prod_cd" {
  name                = "ts-p-trial-system-github-cd-identity"
  resource_group_name = local.identity_resource_group_name
}

data "azurerm_user_assigned_identity" "identity_app_prod_cd" {
  name                = "ts-p-trial-system-app-github-cd-identity"
  resource_group_name = local.identity_resource_group_name
}

data "github_organization_teams" "all" {
  root_teams_only = true
  summary_only    = true
}
