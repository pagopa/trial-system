resource "azurerm_resource_group" "sec_rg" {
  name     = "${local.project}-sec-rg-01"
  location = var.location

  tags = var.tags
}

#tfsec:ignore:azure-keyvault-specify-network-acl:exp:2022-05-01 # already ignored, maybe a bug in tfsec
module "key_vault" {
  source                     = "git::https://github.com/pagopa/terraform-azurerm-v3.git//key_vault?ref=v8.7.0"
  name                       = "${local.project}-kv-01"
  location                   = azurerm_resource_group.sec_rg.location
  resource_group_name        = azurerm_resource_group.sec_rg.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days = 15
  lock_enable                = false

  tags = var.tags
}
