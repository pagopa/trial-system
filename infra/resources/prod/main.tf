terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "<= 3.101.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "<= 2.33.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "<= 4.0.4"
    }
    local = {
      source  = "hashicorp/local"
      version = "<= 2.3.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "<= 3.2.1"
    }
    random = {
      source  = "hashicorp/random"
      version = "<= 3.4.3"
    }
    azapi = {
      source  = "azure/azapi"
      version = "<= 1.9.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfinfprodtrial"
    container_name       = "terraform-state"
    key                  = "trial-infra.prod.tfstate"
  }
}

provider "azurerm" {
  features {}
}

provider "azapi" {
}

module "commons" {
  source = "../modules/commons"

  env_short = "p"

  tags = {
    CreatedBy      = "Terraform"
    Environment    = "Prod"
    Owner          = "TRIAL"
    Source         = "https://github.com/pagopa/trial-system"
    CostCenter     = "TS310 - PAGAMENTI & SERVIZI"
    ManagementTeam = "IO Platform"
  }

  vnet_common = {
    id                  = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-rg-common/providers/Microsoft.Network/virtualNetworks/io-p-vnet-common"
    name                = "io-p-vnet-common"
    resource_group_name = "io-p-rg-common"
  }

  vnet_address_space              = ["10.30.0.0/20"]
  snet_pendpoints_address_space   = ["10.30.2.0/23"]
  cidr_subnet_fnsubscription      = ["10.30.5.0/24"]
  cidr_subnet_fnsubscriptionasync = ["10.30.6.0/24"]

  apim_subnet_cidr = ["10.30.8.0/24"]

  apim_config = {
    sku = "Developer_1"
    publisher_email = "ts-apim@pagopa.it"
  }

}
