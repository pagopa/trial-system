locals {
  prefix         = "ts"
  env_short      = "p"
  location_short = "itn"
  location       = "italynorth"
  project        = "${local.prefix}-${local.env_short}-${local.location_short}"

  tags = {
    CostCenter     = "TS310 - PAGAMENTI & SERVIZI"
    CreatedBy      = "Terraform"
    Environment    = "Prod"
    Owner          = "TRIAL"
    ManagementTeam = "IO Platform"
    Source         = "https://github.com/pagopa/trial-system/blob/main/infra/github-runner/prod"
  }
}
