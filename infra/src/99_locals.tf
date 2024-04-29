locals {
  project              = "${var.prefix}-${var.env_short}"
  domain               = "${var.prefix}-system"
  is_prod              = var.env_short == "p" ? true : false
  application_basename = "trial-system"
}
  