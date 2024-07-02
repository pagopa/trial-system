variable "tlscert-prod-api-trial-pagopa-it" {
  default = {
    repository = {
      organization   = "pagopa"
      name           = "le-azure-acme-tiny"
      branch_name    = "refs/heads/master"
      pipelines_path = "."
    }
    pipeline = {
      enable_tls_cert = true
      path            = "TLS-Certificates\\PROD"
      dns_record_name = "api"
      dns_zone_name   = "trial.pagopa.it"
      # common variables to all pipelines
      variables = {
        CERT_NAME_EXPIRE_SECONDS = "2592000" #30 days
      }
      # common secret variables to all pipelines
      variables_secret = {
      }
    }
  }
}

locals {
  tlscert-prod-api-trial-pagopa-it = {
    tenant_id                           = data.azurerm_client_config.current.tenant_id
    subscription_name                   = local.subscription_name
    subscription_id                     = data.azurerm_subscription.current.subscription_id
    dns_zone_resource_group             = local.prod_dns_zone_resource_group
    credential_subcription              = local.subscription_name
    credential_key_vault_name           = data.azurerm_key_vault.kv_prod.name
    credential_key_vault_resource_group = data.azurerm_key_vault.kv_prod.resource_group_name
    service_connection_ids_authorization = [
      module.PROD-TLS-AZDO-CERT-SERVICE-CONN.service_endpoint_id,
    ]
  }
  tlscert-prod-api-trial-pagopa-it-variables = {
    KEY_VAULT_SERVICE_CONNECTION = module.PROD-TLS-AZDO-CERT-SERVICE-CONN.service_endpoint_name,
    KEY_VAULT_NAME               = data.azurerm_key_vault.kv_prod.name
  }
  tlscert-prod-api-trial-pagopa-it-variables_secret = {
  }
}

module "tlscert-prod-api-trial-pagopa-it-cert_az" {
  source = "github.com/pagopa/azuredevops-tf-modules//azuredevops_build_definition_tls_cert_federated?ref=v7.2.0"

  project_id                   = data.azuredevops_project.project.id
  repository                   = var.tlscert-prod-api-trial-pagopa-it.repository
  path                         = var.tlscert-prod-api-trial-pagopa-it.pipeline.path
  github_service_connection_id = azuredevops_serviceendpoint_github.azure-devops-github-ro.id

  dns_record_name                      = var.tlscert-prod-api-trial-pagopa-it.pipeline.dns_record_name
  dns_zone_name                        = var.tlscert-prod-api-trial-pagopa-it.pipeline.dns_zone_name
  dns_zone_resource_group              = local.tlscert-prod-api-trial-pagopa-it.dns_zone_resource_group
  tenant_id                            = local.tlscert-prod-api-trial-pagopa-it.tenant_id
  subscription_name                    = local.tlscert-prod-api-trial-pagopa-it.subscription_name
  subscription_id                      = local.tlscert-prod-api-trial-pagopa-it.subscription_id
  managed_identity_resource_group_name = local.identity_rg_name

  location                            = local.location
  credential_key_vault_name           = local.tlscert-prod-api-trial-pagopa-it.credential_key_vault_name
  credential_key_vault_resource_group = local.tlscert-prod-api-trial-pagopa-it.credential_key_vault_resource_group

  variables = merge(
    var.tlscert-prod-api-trial-pagopa-it.pipeline.variables,
    local.tlscert-prod-api-trial-pagopa-it-variables,
  )

  variables_secret = merge(
    var.tlscert-prod-api-trial-pagopa-it.pipeline.variables_secret,
    local.tlscert-prod-api-trial-pagopa-it-variables_secret,
  )

  service_connection_ids_authorization = local.tlscert-prod-api-trial-pagopa-it.service_connection_ids_authorization

  schedules = {
    days_to_build              = ["Mon", "Wed", "Fri"]
    schedule_only_with_changes = false
    start_hours                = 2
    start_minutes              = 10
    time_zone                  = "(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna"
    branch_filter = {
      include = ["master", "main"]
      exclude = []
    }
  }
}
