env_short = "p"

tags = {
  CreatedBy   = "Terraform"
  Environment = "Prod"
  Owner       = "TRIAL"
  Source      = "https://github.com/pagopa/trial-system"
  CostCenter  = "TS310 - PAGAMENTI & SERVIZI"
}

location       = "italynorth"
location_short = "itn"

lock_enable = true

cidr_subnet_fnsubscription = ["10.10.100.0/24"]
cidr_subnet_fnsubscriptionasync = ["10.10.101.0/24"]