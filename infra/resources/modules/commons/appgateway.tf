resource "azurerm_resource_group" "rg_routing" {
  name     = format("%s-routing-rg-01", local.project)
  location = var.location

  tags = var.tags
}

resource "azurerm_public_ip" "appgateway_public_ip" {
  name                = format("%s-appgateway-pip-01", local.project)
  resource_group_name = azurerm_resource_group.rg_routing.name
  location            = azurerm_resource_group.rg_routing.location
  sku                 = "Standard"
  allocation_method   = "Static"
  zones               = [1, 2, 3]

  tags = var.tags
}

# Subnet to host the application gateway
module "appgateway_snet" {
  source                                    = "github.com/pagopa/terraform-azurerm-v3//subnet?ref=v8.20.0"
  name                                      = format("%s-agw-snet-01", local.project)
  address_prefixes                          = var.cidr_subnet_appgateway
  resource_group_name                       = azurerm_resource_group.rg_routing.name
  virtual_network_name                      = azurerm_virtual_network.vnet.name
  private_endpoint_network_policies_enabled = true
}

## Application gateway ##
module "app_gw" {
  source = "github.com/pagopa/terraform-azurerm-v3.git//app_gateway?ref=v8.20.0"

  resource_group_name = azurerm_resource_group.rg_routing.name
  location            = azurerm_resource_group.rg_routing.location
  name                = format("%s-agw-01", local.project)
  zones               = [1, 2, 3]

  # SKU
  sku_name = "WAF_v2"
  sku_tier = "WAF_v2"

  # Networking
  subnet_id    = module.appgateway_snet.id
  public_ip_id = azurerm_public_ip.appgateway_public_ip.id

  # Configure backends
  backends = {

    apim = {
      protocol                    = "Https"
      host                        = module.apim.gateway_hostname
      port                        = 443
      ip_addresses                = null # with null value use fqdns
      fqdns                       = [module.apim.gateway_url]
      probe                       = "/status-0123456789abcdef"
      probe_name                  = "probe-apim"
      request_timeout             = 180
      pick_host_name_from_backend = false
    }
  }

  ssl_profiles = [
    {
      name                             = format("%s-ssl-profile", local.project)
      trusted_client_certificate_names = null
      verify_client_cert_issuer_dn     = false
      ssl_policy = {
        disabled_protocols = []
        policy_type        = "Custom"
        policy_name        = "" # with Custom type set empty policy_name (not required by the provider)
        cipher_suites = [
          "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
          "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
        ]
        min_protocol_version = "TLSv1_2"
      }
  }]

  # Configure listeners
  listeners = {

    api-trial-pagopa-it = {
      protocol           = "Https"
      host               = format("api.%s.%s", var.dns_config.external_third_level, var.dns_config.second_level)
      port               = 443
      ssl_profile_name   = null
      firewall_policy_id = null

      certificate = {
        name = var.appgw_config.api_certificate_name
        id = replace(
          data.azurerm_key_vault_certificate.app_gw_api.secret_id,
          "/${data.azurerm_key_vault_certificate.app_gw_api.version}",
          ""
        )
      }
    }
  }

  trusted_client_certificates = []

  # maps listener to backend
  routes = {

    api-trial-pagopa-it = {
      listener              = "api-trial-pagopa-it"
      backend               = "apim"
      rewrite_rule_set_name = "rewrite-rule-set-api"
      priority              = 50
    }
  }

  rewrite_rule_sets = [
    {
      name = "rewrite-rule-set-api"
      rewrite_rules = [{
        name          = "http-headers-api"
        rule_sequence = 100
        conditions    = []
        url           = null
        request_header_configurations = [
          {
            header_name  = "X-Forwarded-For"
            header_value = "{var_client_ip}"
          },
          {
            header_name  = "X-Client-Ip"
            header_value = "{var_client_ip}"
          },
        ]
        response_header_configurations = []
      }]
    }
  ]

  # TLS
  identity_ids = [azurerm_user_assigned_identity.appgateway.id]

  # Scaling
  app_gateway_min_capacity = var.appgw_config.scaling.min_capacity
  app_gateway_max_capacity = var.appgw_config.scaling.max_capacity

  alerts_enabled = var.appgw_config.alerts_enabled

  action = [
    {
      action_group_id    = azurerm_monitor_action_group.error_action_group.id
      webhook_properties = null
    }
  ]

  # metrics docs
  # https://docs.microsoft.com/en-us/azure/azure-monitor/essentials/metrics-supported#microsoftnetworkapplicationgateways
  monitor_metric_alert_criteria = {

    compute_units_usage = {
      description   = "Abnormal compute units usage, probably an high traffic peak"
      frequency     = "PT5M"
      window_size   = "PT5M"
      severity      = 2
      auto_mitigate = true

      criteria = []
      dynamic_criteria = [
        {
          aggregation              = "Average"
          metric_name              = "ComputeUnits"
          operator                 = "GreaterOrLessThan"
          alert_sensitivity        = "High" # todo after api app migration change to High
          evaluation_total_count   = 3
          evaluation_failure_count = 3
          dimension                = []
        }
      ]
    }

    backend_pools_status = {
      description   = "One or more backend pools are down, see Dimension value or check Backend Health on Azure portal. Runbook https://pagopa.atlassian.net/wiki/spaces/IC/pages/914161665/Application+Gateway+-+Backend+Status"
      frequency     = "PT5M"
      window_size   = "PT5M"
      severity      = 0
      auto_mitigate = true

      criteria = [
        {
          aggregation = "Average"
          metric_name = "UnhealthyHostCount"
          operator    = "GreaterThan"
          threshold   = 0
          dimension = [
            {
              name     = "BackendSettingsPool"
              operator = "Include"
              values   = ["*"]
            }
          ]
        }
      ]
      dynamic_criteria = []
    }

    response_time = {
      description   = "Backends response time is too high. See Dimension value to check the Listener unhealty."
      frequency     = "PT5M"
      window_size   = "PT15M"
      severity      = 2
      auto_mitigate = true

      criteria = []
      dynamic_criteria = [
        {
          aggregation              = "Average"
          metric_name              = "BackendLastByteResponseTime"
          operator                 = "GreaterThan"
          alert_sensitivity        = "Medium"
          evaluation_total_count   = 2
          evaluation_failure_count = 2
          dimension = [
            {
              name     = "Listener"
              operator = "Include"
              values   = ["*"]
          }]
        }
      ]
    }

    total_requests = {
      description   = "Traffic is raising"
      frequency     = "PT5M"
      window_size   = "PT15M"
      severity      = 3
      auto_mitigate = true

      criteria = []
      dynamic_criteria = [
        {
          aggregation              = "Total"
          metric_name              = "TotalRequests"
          operator                 = "GreaterThan"
          alert_sensitivity        = "Medium"
          evaluation_total_count   = 1
          evaluation_failure_count = 1
          dimension                = []
        }
      ]
    }

    failed_requests = {
      description   = "Abnormal failed requests. See Dimension value to check the Backend Pool unhealty"
      frequency     = "PT5M"
      window_size   = "PT5M"
      severity      = 1
      auto_mitigate = true

      criteria = []
      dynamic_criteria = [
        {
          aggregation              = "Total"
          metric_name              = "FailedRequests"
          operator                 = "GreaterThan"
          alert_sensitivity        = "High"
          evaluation_total_count   = 4
          evaluation_failure_count = 4
          dimension = [
            {
              name     = "BackendSettingsPool"
              operator = "Include"
              values   = ["*"]
            }
          ]
        }
      ]
    }

  }

  tags = var.tags
}

## user assined identity: (application gateway) ##
resource "azurerm_user_assigned_identity" "appgateway" {
  resource_group_name = azurerm_resource_group.sec_rg.name
  location            = azurerm_resource_group.sec_rg.location
  name                = format("%s-appgateway-identity", local.project)

  tags = var.tags
}

resource "azurerm_key_vault_access_policy" "app_gateway_policy" {
  key_vault_id            = module.key_vault.id
  tenant_id               = data.azurerm_client_config.current.tenant_id
  object_id               = azurerm_user_assigned_identity.appgateway.principal_id
  key_permissions         = []
  secret_permissions      = ["Get", "List"]
  certificate_permissions = ["Get", "List"]
  storage_permissions     = []
}

data "azurerm_key_vault_certificate" "app_gw_api" {
  name         = var.appgw_config.api_certificate_name
  key_vault_id = module.key_vault.id
}