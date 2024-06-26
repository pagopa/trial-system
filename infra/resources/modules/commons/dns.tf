resource "azurerm_resource_group" "domain_rg" {
  name     = "${local.project}-domain-rg-01"
  location = var.location

  tags = var.tags
}

resource "azurerm_dns_zone" "trial_pagopa_it" {
  count               = (var.dns_config == null) ? 0 : 1
  name                = join(".", [var.dns_config.external_third_level, var.dns_config.second_level])
  resource_group_name = azurerm_resource_group.domain_rg.name

  tags = var.tags
}

resource "azurerm_dns_caa_record" "trial_pagopa_it" {
  name                = "@"
  zone_name           = azurerm_dns_zone.io_pagopa_it[0].name
  resource_group_name = azurerm_resource_group.domain_rg.name
  ttl                 = var.dns_config.dns_default_ttl_sec

  record {
    flags = 0
    tag   = "issue"
    value = "digicert.com"
  }

  record {
    flags = 0
    tag   = "issue"
    value = "letsencrypt.org"
  }

  record {
    flags = 0
    tag   = "trialdef"
    value = "mailto:security+caa@pagopa.it"
  }

  tags = var.tags
}
resource "azurerm_dns_a_record" "api_trial_pagopa_it" {
  name                = "api"
  zone_name           = azurerm_dns_zone.trial_pagopa_it[0].name
  resource_group_name = azurerm_resource_group.domain_rg.name
  ttl                 = var.dns_config.dns_default_ttl_sec
  records             = [azurerm_public_ip.appgateway_public_ip.ip_address]

  tags = var.tags
}