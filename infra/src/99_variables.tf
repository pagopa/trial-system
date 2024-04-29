variable "prefix" {
  type    = string
  default = "trial"
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

variable "domain" {
  type    = string
}

variable "tags" {
  type = map(any)
  default = {
    CreatedBy = "Terraform"
  }
}

variable "vnet_address_space" {
  type    = list(string)
  default = ["10.10.0.0/20"]
}

variable "snet_pendpoints_address_spaces" {
  type    = list(string)
  default = ["10.10.3.0/24"]
}

variable "vnet_common" {
   type = object({
    name           = string
    resource_group_name = string
  })
  default = {
    name           = "io-p-vnet-common"
    resource_group_name = "io-p-rg-common"
  }
}

variable "function_cqrs_config" {
  type = object({
    kind     = string
    sku_tier = string
    sku_size = string
    autoscale_minimum = number
    autoscale_maximum = number
    autoscale_default = number
  })
  default = {
    kind     = "Linux"
    sku_tier = "PremiumV3"
    sku_size = "P1v3"
    autoscale_minimum = 1
    autoscale_maximum = 30
    autoscale_default = 1
  }
}

variable "functions_kind" {
  type        = string
  description = "App service plan kind"
  default     = null
}

variable "functions_sku_tier" {
  type        = string
  description = "App service plan sku tier"
  default     = null
}

variable "functions_sku_size" {
  type        = string
  description = "App service plan sku size"
  default     = null
}

variable "functions_autoscale_minimum" {
  type        = number
  description = "The minimum number of instances for this resource."
  default     = 1
}

variable "functions_autoscale_maximum" {
  type        = number
  description = "The maximum number of instances for this resource."
  default     = 30
}

variable "functions_autoscale_default" {
  type        = number
  description = "The number of instances that are available for scaling if metrics are not available for evaluation."
  default     = 1
}