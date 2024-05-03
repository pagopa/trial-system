locals {
  prefix    = "ts"
  env_short = "p"

  location_short = "itn"
  location       = "italynorth"
  domain         = "trial-system"
  project        = "${local.prefix}-${local.env_short}-${local.location_short}"

  repo_name = "trial-system"

  identity_rg = "${local.prefix}-${local.env_short}-identity-rg"

  tags = {
    CreatedBy      = "Terraform"
    Environment    = "Prod"
    Owner          = "TRIAL"
    Source         = "https://github.com/pagopa/trial-system"
    CostCenter     = "TS310 - PAGAMENTI & SERVIZI"
    ManagementTeam = "IO Platform"
  }
}
