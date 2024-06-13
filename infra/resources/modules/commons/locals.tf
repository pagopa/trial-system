locals {
  project              = "${var.prefix}-${var.env_short}-${var.location_short}"
  domain               = "${var.prefix}-trial"
  is_prod              = var.env_short == "p" ? true : false
  application_basename = "trial-system"
  servicebus_namespace = "${local.domain}-srvb"
}
