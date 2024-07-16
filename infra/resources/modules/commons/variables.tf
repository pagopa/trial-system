variable "prefix" {
  type    = string
  default = "ts"
  validation {
    condition = (
      length(var.prefix) < 6
    )
    error_message = "Max length is 6 chars."
  }
}

variable "env_short" {
  type = string
  validation {
    condition = (
      length(var.env_short) <= 1
    )
    error_message = "Max length is 1 chars."
  }
}

variable "location" {
  type    = string
  default = "italynorth"
}

variable "location_short" {
  type    = string
  default = "itn"
}

variable "tags" {
  type = map(any)
  default = {
    CreatedBy = "Terraform"
  }
}

variable "vnet_address_space" {
  type        = list(string)
  description = "The VNET address space"
}

variable "snet_pendpoints_address_space" {
  type        = list(string)
  description = "The Private endpoint subnet's address space"
}


variable "cidr_subnet_fnsubscriptionasync" {
  type        = list(string)
  description = "The subscription async function address space"
}

variable "cidr_subnet_fnsubscription" {
  type        = list(string)
  description = "The subscription function address space"
}

variable "cidr_subnet_appgateway" {
  type        = list(string)
  description = "The app gateway address space"
}

variable "vnet_common" {
  type = object({
    weu = object({
      id                  = string
      name                = string
      resource_group_name = string
    })

    itn = object({
      id                  = string
      name                = string
      resource_group_name = string
    })
  })
  description = "Th VNET Common variable references for PROD-IO subscription"
}

variable "function_async_config" {
  type = object({
    kind              = string
    sku_tier          = string
    sku_size          = string
    autoscale_minimum = number
    autoscale_maximum = number
    autoscale_default = number
  })
  default = {
    kind              = "Linux"
    sku_tier          = "PremiumV3"
    sku_size          = "P1v3"
    autoscale_minimum = 1
    autoscale_maximum = 30
    autoscale_default = 1
  }
}

variable "function_subscription_config" {
  type = object({
    kind              = string
    sku_tier          = string
    sku_size          = string
    autoscale_minimum = number
    autoscale_maximum = number
    autoscale_default = number
  })
  default = {
    kind              = "Linux"
    sku_tier          = "PremiumV3"
    sku_size          = "P1v3"
    autoscale_minimum = 1
    autoscale_maximum = 30
    autoscale_default = 1
  }
}

variable "dns_config" {
  type = object({
    second_level         = string
    external_third_level = string
    internal_third_level = string
    dns_default_ttl_sec  = number
  })

  default = {
    second_level         = "pagopa.it"
    external_third_level = "trial"
    internal_third_level = "internal"
    dns_default_ttl_sec  = 3600
  }
}

variable "appgw_config" {
  type = object({
    api_certificate_name = string
    alerts_enabled       = bool
    scaling = object({
      min_capacity = string
      max_capacity = string
    })
  })

  default = {
    api_certificate_name = "api-trial-pagopa-it"
    alerts_enabled       = true
    scaling = {
      min_capacity = "1"
      max_capacity = "10"
    }
  }
}

variable "cidr_subnet_apim" {
  type = list(string)
}

variable "apim_config" {
  type = object({
    sku             = string
    publisher_email = string
  })
}
