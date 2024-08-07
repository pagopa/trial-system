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

resource "azurerm_resource_group" "dashboards" {
  name     = "dashboards"
  location = local.location_it
}

module "federated_identities" {
  source = "github.com/pagopa/dx//infra/modules/azure_federated_identity_with_github?ref=main"

  prefix       = local.prefix
  env_short    = local.env_short
  env          = "prod"
  domain       = local.domain
  repositories = [local.repo_name]
  tags         = local.tags

  continuos_integration = {
    enable = true
    roles = {
      resource_groups = {
        terraform-state-rg = [
          "Storage Blob Data Contributor"
        ],
        ts-p-itn-routing-rg-01 = [
          "API Management Service Contributor"
        ],
      },
      subscription = [
        "Reader",
        "Reader and Data Access",
        "PagoPA IaC Reader",
        "DocumentDB Account Contributor"
      ]
    }
  }

  continuos_delivery = {
    enable = true
    roles = {
      subscription = ["Contributor"]
      resource_groups = {
        terraform-state-rg = [
          "Storage Blob Data Contributor"
        ],
        ts-p-itn-data-rg-01 = [
          "Role Based Access Control Administrator"
        ]
      }
    }
  }

  depends_on = [azurerm_resource_group.identity]
}

module "app_federated_identities" {
  source = "github.com/pagopa/dx//infra/modules/azure_federated_identity_with_github?ref=main"

  prefix       = local.prefix
  env_short    = local.env_short
  env          = "app-prod"
  domain       = "${local.domain}-app"
  repositories = [local.repo_name]
  tags         = local.tags

  continuos_integration = { enable = false }

  depends_on = [azurerm_resource_group.identity]
}

resource "azurerm_role_assignment" "ci" {
  provider             = azurerm.prodio
  scope                = data.azurerm_subscription.prodio.id
  principal_id         = module.federated_identities.federated_ci_identity.id
  role_definition_name = "Reader"
}

resource "azurerm_role_assignment" "cd" {
  for_each             = toset(["Reader", "Private DNS Zone Contributor", azurerm_role_definition.rw_peering_role.name])
  provider             = azurerm.prodio
  scope                = data.azurerm_subscription.prodio.id
  principal_id         = module.federated_identities.federated_cd_identity.id
  role_definition_name = each.value
}

resource "azurerm_role_assignment" "app_cd" {
  provider             = azurerm.prodio
  scope                = data.azurerm_subscription.prodio.id
  principal_id         = module.app_federated_identities.federated_cd_identity.id
  role_definition_name = "Reader"
}

module "opex_federated_identities" {
  source = "github.com/pagopa/dx//infra/modules/azure_federated_identity_with_github?ref=main"

  prefix       = local.prefix
  env_short    = local.env_short
  env          = "opex-prod"
  domain       = "${local.domain}-opex"
  repositories = [local.repo_name]

  continuos_integration = {
    enable = true
    roles = {
      subscription = ["Reader"]
      resource_groups = {
        dashboards = [
          "Reader"
        ],
        terraform-state-rg = [
          "Storage Blob Data Reader",
          "Reader and Data Access"
        ]
      }
    }
  }

  continuos_delivery = {
    enable = true

    roles = {
      subscription = ["Reader"]
      resource_groups = {
        dashboards = [
          "Contributor"
        ],
        terraform-state-rg = [
          "Storage Blob Data Contributor",
          "Reader and Data Access"
        ]
      }
    }
  }

  depends_on = [azurerm_resource_group.dashboards]

  tags = local.tags
}

resource "azurerm_role_definition" "rw_peering_role" {
  name        = "PagoPA VNet Peering Admin Role"
  scope       = data.azurerm_subscription.prodio.id
  description = "Custom role used by Trial System CI/CD to create and read VNET peerings with PROD-IO subscription"

  permissions {
    actions = [
      "Microsoft.Network/virtualNetworks/virtualNetworkPeerings/write",
      "Microsoft.Network/virtualNetworks/peer/action",
      "Microsoft.ClassicNetwork/virtualNetworks/peer/action",
      "Microsoft.Network/virtualNetworks/virtualNetworkPeerings/read",
      "Microsoft.Network/virtualNetworks/virtualNetworkPeerings/delete"
    ]
  }

  assignable_scopes = [
    data.azurerm_subscription.prodio.id
  ]
}
