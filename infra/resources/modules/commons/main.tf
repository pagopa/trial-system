terraform {
  required_providers {
    azurerm = {
      source = "hashicorp/azurerm"
    }
  }
}

provider "azurerm" {
  features {

  }
  alias           = "prodio"
  subscription_id = "ec285037-c673-4f58-b594-d7c480da4e8b"
}