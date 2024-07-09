module "apim" {
  source = "github.com/pagopa/terraform-azurerm-v3//api_management?ref=v8.26.0"

  location                  = var.location
  name                      = format("%s-apim-01", local.project)
  resource_group_name       = azurerm_resource_group.rg_routing.name
  publisher_name            = "TRIAL"
  publisher_email           = var.apim_config.publisher_email
  notification_sender_email = var.apim_config.publisher_email
  sku_name                  = var.apim_config.sku
  virtual_network_type      = "Internal"
  subnet_id                 = module.apim_snet.id

  # not used at the moment
  redis_cache_id = null

  application_insights = {
    enabled             = true
    instrumentation_key = azurerm_application_insights.ai.instrumentation_key
  }

  tags = var.tags
}

#resource "azurerm_api_management_custom_domain" "api_custom_domain" {
#  api_management_id = module.apim.id
#
#  gateway {
#    host_name = local.api_domain
#    key_vault_id = replace(
#      data.azurerm_key_vault_certificate.app_gw_platform.secret_id,
#      "/${data.azurerm_key_vault_certificate.app_gw_platform.version}",
#      ""
#    )
#  }
#}
