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
  source = "../../modules/commons"

  env_short = "p"

  tags = {
    CreatedBy      = "Terraform"
    Environment    = "Prod"
    Owner          = "TRIAL"
    Source         = "https://github.com/pagopa/trial-system"
    CostCenter     = "TS310 - PAGAMENTI & SERVIZI"
    ManagementTeam = "IO Platform"
  }

  vnet_address_space              = ["10.30.0.0/20"]
  snet_pendpoints_address_space   = ["10.30.2.0/23"]
  cidr_subnet_fnmanagement        = ["10.40.4.0/24"]
  cidr_subnet_fnsubscription      = ["10.30.5.0/24"]
  cidr_subnet_fnsubscriptionasync = ["10.30.6.0/24"]
}
