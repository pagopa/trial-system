terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "<= 3.104.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfinfprodtrial"
    container_name       = "terraform-state"
    key                  = "trial-infra.identity.prod.westeurope.tfstate"
  }
}

provider "azurerm" {
  features {}
}

provider "azurerm" {
  features {}
  alias           = "prodio"
  subscription_id = "ec285037-c673-4f58-b594-d7c480da4e8b"
}

data "azurerm_subscription" "prodio" {
  provider = azurerm.prodio
}

resource "azurerm_resource_group" "identity" {
  name     = "${local.project}-identity-rg"
  location = local.location
}

module "federated_identities" {
  source = "github.com/pagopa/dx//infra/modules/azure_federated_identity_with_github?ref=main"

  prefix       = local.prefix
  env_short    = local.env_short
  env          = "prod"
  domain       = local.domain
  repositories = [local.repo_name]
  tags         = local.tags

  depends_on = [azurerm_resource_group.identity]
}

resource "azurerm_role_assignment" "ci" {
  provider             = azurerm.prodio
  scope                = data.azurerm_subscription.prodio.id
  principal_id         = module.federated_identities.federated_ci_identity.id
  role_definition_name = "Reader"
}

resource "azurerm_role_assignment" "cd" {
  provider             = azurerm.prodio
  scope                = data.azurerm_subscription.prodio.id
  principal_id         = module.federated_identities.federated_cd_identity.id
  role_definition_name = "Reader"
}