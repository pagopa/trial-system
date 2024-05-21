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
    key                  = "trial-infra.github-runner.tfstate"
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "github_runner" {
  name     = "${local.project}-github-runner-rg-01"
  location = local.location

  tags = local.tags
}
