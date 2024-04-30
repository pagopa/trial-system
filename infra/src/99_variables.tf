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


variable "cidr_subnet_fnsubscriptionasync" {
  type    = list(string)
  description = "The subscription async function address space"
}

variable "cidr_subnet_fnsubscription" {
  type    = list(string)
  description = "The subscription function address space"
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

variable "function_async_config" {
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

variable "function_subscription_config" {
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
