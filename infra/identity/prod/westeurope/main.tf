terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "<= 3.100.0"
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
  features {
  }
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
