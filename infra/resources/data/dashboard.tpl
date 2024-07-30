{
  "lenses": {
    "0": {
      "order": 0,
      "parts": {
        "0": {
          "position": {
            "x": 0,
            "y": 0,
            "colSpan": 12,
            "rowSpan": 1
          },
          "metadata": {
            "inputs": [],
            "type": "Extension/HubsExtension/PartType/MarkdownPart",
            "settings": {
              "content": {
                "content": "### Gateway (App IO)",
                "title": "",
                "subtitle": "",
                "markdownSource": 1,
                "markdownUri": ""
              }
            }
          }
        },
        "1": {
          "position": {
            "x": 12,
            "y": 0,
            "colSpan": 12,
            "rowSpan": 1
          },
          "metadata": {
            "inputs": [],
            "type": "Extension/HubsExtension/PartType/MarkdownPart",
            "settings": {
              "content": {
                "content": "### Store - Italy North",
                "title": "",
                "subtitle": "",
                "markdownSource": 1,
                "markdownUri": ""
              }
            }
          }
        },
        "2": {
          "position": {
            "x": 0,
            "y": 1,
            "colSpan": 6,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "${io_app_gateway}"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/api/v1/trials/[^/]+/subscriptions\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/trials/{trialId}/subscriptions",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "aggregation": "Sum",
                  "splitBy": [],
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ]
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Dimensions": {
                  "aggregation": "Sum",
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ]
                },
                "PartTitle": "Response Codes (5m)",
                "Query": "\nlet api_url = \"/api/v1/trials/[^/]+/subscriptions\";\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea"
              }
            }
          }
        },
        "3": {
          "position": {
            "x": 6,
            "y": 1,
            "colSpan": 6,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "${io_app_gateway}"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/trials/[^/]+/subscriptions\"\n| summarize\n    watermark=threshold,\n    duration_percentile_95=percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/api/v1/trials/{trialId}/subscriptions",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "aggregation": "Sum",
                  "splitBy": [],
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "duration_percentile_95",
                      "type": "real"
                    }
                  ]
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Dimensions": {
                  "aggregation": "Sum",
                  "splitBy": [],
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "duration_percentile_95",
                      "type": "real"
                    }
                  ]
                },
                "PartTitle": "Percentile Response Time (5m)",
                "Query": "\nlet api_hosts = datatable (name: string) [\"app-backend.io.italia.it\", \"api-app.io.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/api/v1/trials/[^/]+/subscriptions\"\n| summarize\n    watermark=threshold,\n    duration_percentile_95=percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n",
                "SpecificChart": "Line"
              }
            }
          }
        },
        "4": {
          "position": {
            "x": 12,
            "y": 1,
            "colSpan": 4,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "sharedTimeRange",
                "isOptional": true
              },
              {
                "name": "options",
                "value": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${cosmosdb_account}"
                        },
                        "name": "TotalRequests",
                        "aggregationType": 7,
                        "namespace": "microsoft.documentdb/databaseaccounts",
                        "metricVisualization": {
                          "displayName": "Total Requests",
                          "color": null
                        }
                      }
                    ],
                    "title": "Throttled Requests (429)",
                    "titleKind": 2,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideSubtitle": false
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      }
                    },
                    "filterCollection": {
                      "filters": [
                        {
                          "key": "StatusCode",
                          "operator": 0,
                          "values": [
                            "429"
                          ]
                        }
                      ]
                    },
                    "grouping": {
                      "dimension": "StatusCode",
                      "top": 50
                    },
                    "timespan": {
                      "relative": {
                        "duration": 14400000
                      },
                      "showUTCTime": false,
                      "grain": 1
                    }
                  }
                },
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${cosmosdb_account}"
                        },
                        "name": "TotalRequests",
                        "aggregationType": 7,
                        "namespace": "microsoft.documentdb/databaseaccounts",
                        "metricVisualization": {
                          "displayName": "Total Requests",
                          "color": null
                        }
                      }
                    ],
                    "title": "Throttled Requests (429)",
                    "titleKind": 2,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideSubtitle": false,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      },
                      "disablePinning": true
                    },
                    "grouping": {
                      "dimension": "CollectionName",
                      "sort": 2,
                      "top": 10
                    }
                  }
                }
              }
            },
            "filters": {
              "StatusCode": {
                "model": {
                  "operator": "equals",
                  "values": [
                    "429"
                  ]
                }
              },
              "Region": {
                "model": {
                  "operator": "equals",
                  "values": [
                    "Italy North"
                  ]
                }
              }
            }
          }
        },
        "5": {
          "position": {
            "x": 16,
            "y": 1,
            "colSpan": 4,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "options",
                "value": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${cosmosdb_account}"
                        },
                        "name": "NormalizedRUConsumption",
                        "aggregationType": 3,
                        "namespace": "microsoft.documentdb/databaseaccounts",
                        "metricVisualization": {
                          "displayName": "Normalized RU Consumption"
                        }
                      }
                    ],
                    "title": "Max Normalized RU Consumption for ts-p-itn-cosno-01",
                    "titleKind": 1,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      }
                    },
                    "timespan": {
                      "relative": {
                        "duration": 86400000
                      },
                      "showUTCTime": false,
                      "grain": 1
                    }
                  }
                },
                "isOptional": true
              },
              {
                "name": "sharedTimeRange",
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${cosmosdb_account}"
                        },
                        "name": "NormalizedRUConsumption",
                        "aggregationType": 3,
                        "namespace": "microsoft.documentdb/databaseaccounts",
                        "metricVisualization": {
                          "displayName": "Normalized RU Consumption"
                        }
                      }
                    ],
                    "title": "Max Normalized RU Consumption for ts-p-itn-cosno-01 by CollectionName where DatabaseName = 'db' and Region = 'Italy North'",
                    "titleKind": 1,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      },
                      "disablePinning": true
                    },
                    "grouping": {
                      "dimension": "CollectionName",
                      "sort": 2,
                      "top": 10
                    }
                  }
                }
              }
            },
            "filters": {
              "DatabaseName": {
                "model": {
                  "operator": "equals",
                  "values": [
                    "${db_name}"
                  ]
                }
              },
              "Region": {
                "model": {
                  "operator": "equals",
                  "values": [
                    "Italy North"
                  ]
                }
              }
            }
          }
        },
        "6": {
          "position": {
            "x": 20,
            "y": 1,
            "colSpan": 4,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "sharedTimeRange",
                "isOptional": true
              },
              {
                "name": "options",
                "value": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${cosmosdb_account}"
                        },
                        "name": "ServerSideLatency",
                        "aggregationType": 4,
                        "namespace": "microsoft.documentdb/databaseaccounts",
                        "metricVisualization": {
                          "displayName": "Server Side Latency",
                          "color": null
                        }
                      }
                    ],
                    "title": "Server Side Latency (Avg) By Region",
                    "titleKind": 2,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideSubtitle": false
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      }
                    },
                    "grouping": {
                      "dimension": "Region",
                      "top": 50
                    },
                    "timespan": {
                      "relative": {
                        "duration": 14400000
                      },
                      "showUTCTime": false,
                      "grain": 1
                    }
                  }
                },
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${cosmosdb_account}"
                        },
                        "name": "ServerSideLatency",
                        "aggregationType": 4,
                        "namespace": "microsoft.documentdb/databaseaccounts",
                        "metricVisualization": {
                          "displayName": "Server Side Latency",
                          "color": null
                        }
                      }
                    ],
                    "title": "Server Side Latency (Avg) By Region",
                    "titleKind": 2,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideSubtitle": false
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      },
                      "disablePinning": true
                    },
                    "grouping": {
                      "dimension": "Region",
                      "top": 50
                    }
                  }
                }
              }
            }
          }
        },
        "7": {
          "position": {
            "x": 0,
            "y": 4,
            "colSpan": 12,
            "rowSpan": 1
          },
          "metadata": {
            "inputs": [],
            "type": "Extension/HubsExtension/PartType/MarkdownPart",
            "settings": {
              "content": {
                "content": "### Gateway (3rd party)",
                "title": "",
                "subtitle": "",
                "markdownSource": 1,
                "markdownUri": {}
              }
            }
          }
        },
        "8": {
          "position": {
            "x": 12,
            "y": 4,
            "colSpan": 6,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "options",
                "isOptional": true
              },
              {
                "name": "sharedTimeRange",
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${cosmosdb_account}"
                        },
                        "name": "ProvisionedThroughput",
                        "aggregationType": 3,
                        "namespace": "microsoft.documentdb/databaseaccounts",
                        "metricVisualization": {
                          "displayName": "Provisioned Throughput",
                          "resourceDisplayName": "ts-p-itn-cosno-01"
                        }
                      },
                      {
                        "resourceMetadata": {
                          "id": "${cosmosdb_account}"
                        },
                        "name": "AutoscaleMaxThroughput",
                        "aggregationType": 3,
                        "namespace": "microsoft.documentdb/databaseaccounts",
                        "metricVisualization": {
                          "displayName": "Autoscale Max Throughput",
                          "resourceDisplayName": "ts-p-itn-cosno-01"
                        }
                      }
                    ],
                    "title": "Subscription Provisioned Throughput - Autoscale Throughput",
                    "titleKind": 2,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      },
                      "disablePinning": true
                    }
                  }
                }
              }
            },
            "filters": {
              "CollectionName": {
                "model": {
                  "operator": "equals",
                  "values": [
                    "${subscription_container_name}"
                  ]
                }
              },
              "Region": {
                "model": {
                  "operator": "equals",
                  "values": [
                    "Italy North"
                  ]
                }
              }
            }
          }
        },
        "9": {
          "position": {
            "x": 18,
            "y": 4,
            "colSpan": 6,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "options",
                "isOptional": true
              },
              {
                "name": "sharedTimeRange",
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${cosmosdb_account}"
                        },
                        "name": "ProvisionedThroughput",
                        "aggregationType": 3,
                        "namespace": "microsoft.documentdb/databaseaccounts",
                        "metricVisualization": {
                          "displayName": "Provisioned Throughput",
                          "resourceDisplayName": "ts-p-itn-cosno-01"
                        }
                      },
                      {
                        "resourceMetadata": {
                          "id": "${cosmosdb_account}"
                        },
                        "name": "AutoscaleMaxThroughput",
                        "aggregationType": 3,
                        "namespace": "microsoft.documentdb/databaseaccounts",
                        "metricVisualization": {
                          "displayName": "Autoscale Max Throughput",
                          "resourceDisplayName": "ts-p-itn-cosno-01"
                        }
                      }
                    ],
                    "title": "Activation  Provisioned Throughput - Autoscale Throughput",
                    "titleKind": 2,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      },
                      "disablePinning": true
                    }
                  }
                }
              }
            },
            "filters": {
              "CollectionName": {
                "model": {
                  "operator": "equals",
                  "values": [
                    "${activations_container_name}"
                  ]
                }
              },
              "Region": {
                "model": {
                  "operator": "equals",
                  "values": [
                    "Italy North"
                  ]
                }
              }
            }
          }
        },
        "10": {
          "position": {
            "x": 0,
            "y": 5,
            "colSpan": 6,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "${app_gateway}"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_url = \"/manage/api/v1/trials/[^/]+/subscriptions/[^/]+\";\nlet api_hosts = datatable (name: string) [\"api.trial.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "Pie",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Response Codes (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/manage/api/v1/trials/{trialId}/subscriptions/{userId}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "aggregation": "Sum",
                  "splitBy": [],
                  "xAxis": {
                    "name": "httpStatus_d",
                    "type": "string"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ]
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Dimensions": {
                  "aggregation": "Sum",
                  "splitBy": [
                    {
                      "name": "HTTPStatus",
                      "type": "string"
                    }
                  ],
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "count_",
                      "type": "long"
                    }
                  ]
                },
                "PartTitle": "Response Codes (5m)",
                "Query": "\nlet api_url = \"/manage/api/v1/trials/[^/]+/subscriptions/[^/]+\";\nlet api_hosts = datatable (name: string) [\"api.trial.pagopa.it\"];\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex api_url\n| extend HTTPStatus = case(\n  httpStatus_d between (100 .. 199), \"1XX\",\n  httpStatus_d between (200 .. 299), \"2XX\",\n  httpStatus_d between (300 .. 399), \"3XX\",\n  httpStatus_d between (400 .. 499), \"4XX\",\n  \"5XX\")\n| summarize count() by HTTPStatus, bin(TimeGenerated, 5m)\n| render areachart with (xtitle = \"time\", ytitle= \"count\")\n",
                "SpecificChart": "StackedArea"
              }
            }
          }
        },
        "11": {
          "position": {
            "x": 6,
            "y": 5,
            "colSpan": 6,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "isOptional": true
              },
              {
                "name": "Scope",
                "value": {
                  "resourceIds": [
                    "${app_gateway}"
                  ]
                },
                "isOptional": true
              },
              {
                "name": "PartId",
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "2.0",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "PT4H",
                "isOptional": true
              },
              {
                "name": "DashboardId",
                "isOptional": true
              },
              {
                "name": "DraftRequestParameters",
                "value": {
                  "scope": "hierarchy"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "\nlet api_hosts = datatable (name: string) [\"api.trial.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/manage/api/v1/trials/[^/]+/subscriptions/[^/]+\"\n| summarize\n    watermark=threshold,\n    duration_percentile_95=percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n",
                "isOptional": true
              },
              {
                "name": "ControlType",
                "value": "FrameControlChart",
                "isOptional": true
              },
              {
                "name": "SpecificChart",
                "value": "StackedColumn",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Percentile Response Time (5m)",
                "isOptional": true
              },
              {
                "name": "PartSubTitle",
                "value": "/manage/api/v1/trials/{trialId}/subscriptions/{userId}",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "aggregation": "Sum",
                  "splitBy": [],
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "duration_percentile_95",
                      "type": "real"
                    }
                  ]
                },
                "isOptional": true
              },
              {
                "name": "LegendOptions",
                "value": {
                  "isEnabled": true,
                  "position": "Bottom"
                },
                "isOptional": true
              },
              {
                "name": "IsQueryContainTimeRange",
                "value": false,
                "isOptional": true
              }
            ],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Dimensions": {
                  "aggregation": "Sum",
                  "splitBy": [],
                  "xAxis": {
                    "name": "TimeGenerated",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "watermark",
                      "type": "long"
                    },
                    {
                      "name": "duration_percentile_95",
                      "type": "real"
                    }
                  ]
                },
                "PartTitle": "Percentile Response Time (5m)",
                "Query": "\nlet api_hosts = datatable (name: string) [\"api.trial.pagopa.it\"];\nlet threshold = 1;\nAzureDiagnostics\n| where originalHost_s in (api_hosts)\n| where requestUri_s matches regex \"/manage/api/v1/trials/[^/]+/subscriptions/[^/]+\"\n| summarize\n    watermark=threshold,\n    duration_percentile_95=percentiles(timeTaken_d, 95) by bin(TimeGenerated, 5m)\n| render timechart with (xtitle = \"time\", ytitle= \"response time(s)\")\n",
                "SpecificChart": "Line"
              }
            }
          }
        },
        "12": {
          "position": {
            "x": 12,
            "y": 7,
            "colSpan": 12,
            "rowSpan": 1
          },
          "metadata": {
            "inputs": [],
            "type": "Extension/HubsExtension/PartType/MarkdownPart",
            "settings": {
              "content": {
                "content": "### Store - Germany West Central\n",
                "title": "",
                "subtitle": "",
                "markdownSource": 1,
                "markdownUri": ""
              }
            }
          }
        },
        "13": {
          "position": {
            "x": 0,
            "y": 8,
            "colSpan": 4,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "options",
                "isOptional": true
              },
              {
                "name": "sharedTimeRange",
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${apim}"
                        },
                        "name": "Requests",
                        "aggregationType": 1,
                        "namespace": "microsoft.apimanagement/service",
                        "metricVisualization": {
                          "displayName": "Requests",
                          "resourceDisplayName": "ts-p-itn-apim-01"
                        }
                      }
                    ],
                    "title": "GatewayResponseCodeCategory",
                    "titleKind": 2,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      },
                      "disablePinning": true
                    },
                    "grouping": {
                      "dimension": "GatewayResponseCodeCategory",
                      "sort": 2,
                      "top": 10
                    }
                  }
                }
              }
            }
          }
        },
        "14": {
          "position": {
            "x": 4,
            "y": 8,
            "colSpan": 4,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "options",
                "isOptional": true
              },
              {
                "name": "sharedTimeRange",
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${apim}"
                        },
                        "name": "Capacity",
                        "aggregationType": 4,
                        "namespace": "microsoft.apimanagement/service",
                        "metricVisualization": {
                          "displayName": "Capacity",
                          "resourceDisplayName": "ts-p-itn-apim-01"
                        }
                      }
                    ],
                    "title": "APIM capacity",
                    "titleKind": 2,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      },
                      "disablePinning": true
                    }
                  }
                }
              }
            }
          }
        },
        "15": {
          "position": {
            "x": 8,
            "y": 8,
            "colSpan": 4,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "options",
                "isOptional": true
              },
              {
                "name": "sharedTimeRange",
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${apim}"
                        },
                        "name": "BackendDuration",
                        "aggregationType": 3,
                        "namespace": "microsoft.apimanagement/service",
                        "metricVisualization": {
                          "displayName": "Duration of Backend Requests",
                          "resourceDisplayName": "ts-p-itn-apim-01"
                        }
                      }
                    ],
                    "title": "Max Duration of Backend Requests",
                    "titleKind": 2,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      },
                      "disablePinning": true
                    },
                    "grouping": {
                      "dimension": "ApiId",
                      "sort": 2,
                      "top": 10
                    }
                  }
                }
              }
            }
          }
        },
        "16": {
          "position": {
            "x": 12,
            "y": 8,
            "colSpan": 4,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "sharedTimeRange",
                "isOptional": true
              },
              {
                "name": "options",
                "value": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${cosmosdb_account}"
                        },
                        "name": "TotalRequests",
                        "aggregationType": 7,
                        "namespace": "microsoft.documentdb/databaseaccounts",
                        "metricVisualization": {
                          "displayName": "Total Requests",
                          "color": null
                        }
                      }
                    ],
                    "title": "Throttled Requests (429)",
                    "titleKind": 2,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideSubtitle": false
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      }
                    },
                    "filterCollection": {
                      "filters": [
                        {
                          "key": "StatusCode",
                          "operator": 0,
                          "values": [
                            "429"
                          ]
                        }
                      ]
                    },
                    "grouping": {
                      "dimension": "StatusCode",
                      "top": 50
                    },
                    "timespan": {
                      "relative": {
                        "duration": 14400000
                      },
                      "showUTCTime": false,
                      "grain": 1
                    }
                  }
                },
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${cosmosdb_account}"
                        },
                        "name": "TotalRequests",
                        "aggregationType": 7,
                        "namespace": "microsoft.documentdb/databaseaccounts",
                        "metricVisualization": {
                          "displayName": "Total Requests",
                          "color": null
                        }
                      }
                    ],
                    "title": "Throttled Requests (429)",
                    "titleKind": 2,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideSubtitle": false,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      },
                      "disablePinning": true
                    },
                    "grouping": {
                      "dimension": "CollectionName",
                      "sort": 2,
                      "top": 10
                    }
                  }
                }
              }
            },
            "filters": {
              "StatusCode": {
                "model": {
                  "operator": "equals",
                  "values": [
                    "429"
                  ]
                }
              },
              "Region": {
                "model": {
                  "operator": "equals",
                  "values": [
                    "Germany West Central"
                  ]
                }
              }
            }
          }
        },
        "17": {
          "position": {
            "x": 16,
            "y": 8,
            "colSpan": 4,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "options",
                "value": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${cosmosdb_account}"
                        },
                        "name": "NormalizedRUConsumption",
                        "aggregationType": 3,
                        "namespace": "microsoft.documentdb/databaseaccounts",
                        "metricVisualization": {
                          "displayName": "Normalized RU Consumption"
                        }
                      }
                    ],
                    "title": "Max Normalized RU Consumption for ts-p-itn-cosno-01",
                    "titleKind": 1,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      }
                    },
                    "timespan": {
                      "relative": {
                        "duration": 86400000
                      },
                      "showUTCTime": false,
                      "grain": 1
                    }
                  }
                },
                "isOptional": true
              },
              {
                "name": "sharedTimeRange",
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${cosmosdb_account}"
                        },
                        "name": "NormalizedRUConsumption",
                        "aggregationType": 3,
                        "namespace": "microsoft.documentdb/databaseaccounts",
                        "metricVisualization": {
                          "displayName": "Normalized RU Consumption"
                        }
                      }
                    ],
                    "title": "Max Normalized RU Consumption for ts-p-itn-cosno-01 by CollectionName where DatabaseName = 'db' and Region = 'Germany West Central'",
                    "titleKind": 1,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      },
                      "disablePinning": true
                    },
                    "grouping": {
                      "dimension": "CollectionName",
                      "sort": 2,
                      "top": 10
                    }
                  }
                }
              }
            },
            "filters": {
              "DatabaseName": {
                "model": {
                  "operator": "equals",
                  "values": [
                    "${db_name}"
                  ]
                }
              },
              "Region": {
                "model": {
                  "operator": "equals",
                  "values": [
                    "Germany West Central"
                  ]
                }
              }
            }
          }
        },
        "18": {
          "position": {
            "x": 20,
            "y": 8,
            "colSpan": 4,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "options",
                "isOptional": true
              },
              {
                "name": "sharedTimeRange",
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${cosmosdb_account}"
                        },
                        "name": "ReplicationLatency",
                        "aggregationType": 3,
                        "namespace": "microsoft.documentdb/databaseaccounts",
                        "metricVisualization": {
                          "displayName": "P99 Replication Latency",
                          "resourceDisplayName": "ts-p-itn-cosno-01"
                        }
                      }
                    ],
                    "title": "P99 Replication Latency",
                    "titleKind": 2,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      },
                      "disablePinning": true
                    }
                  }
                }
              }
            }
          }
        },
        "19": {
          "position": {
            "x": 0,
            "y": 11,
            "colSpan": 12,
            "rowSpan": 1
          },
          "metadata": {
            "inputs": [],
            "type": "Extension/HubsExtension/PartType/MarkdownPart",
            "settings": {
              "content": {
                "content": "### Backend",
                "title": "",
                "subtitle": "",
                "markdownSource": 1,
                "markdownUri": ""
              }
            }
          }
        },
        "20": {
          "position": {
            "x": 12,
            "y": 11,
            "colSpan": 6,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "options",
                "isOptional": true
              },
              {
                "name": "sharedTimeRange",
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${cosmosdb_account}"
                        },
                        "name": "ProvisionedThroughput",
                        "aggregationType": 3,
                        "namespace": "microsoft.documentdb/databaseaccounts",
                        "metricVisualization": {
                          "displayName": "Provisioned Throughput",
                          "resourceDisplayName": "ts-p-itn-cosno-01"
                        }
                      },
                      {
                        "resourceMetadata": {
                          "id": "${cosmosdb_account}"
                        },
                        "name": "AutoscaleMaxThroughput",
                        "aggregationType": 3,
                        "namespace": "microsoft.documentdb/databaseaccounts",
                        "metricVisualization": {
                          "displayName": "Autoscale Max Throughput",
                          "resourceDisplayName": "ts-p-itn-cosno-01"
                        }
                      }
                    ],
                    "title": "Subscription 'Germany West Central' Provisioned Throughput - Autoscale Throughput",
                    "titleKind": 2,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      },
                      "disablePinning": true
                    }
                  }
                }
              }
            },
            "filters": {
              "CollectionName": {
                "model": {
                  "operator": "equals",
                  "values": [
                    "${subscription_container_name}"
                  ]
                }
              },
              "Region": {
                "model": {
                  "operator": "equals",
                  "values": [
                    "Germany West Central"
                  ]
                }
              }
            }
          }
        },
        "21": {
          "position": {
            "x": 0,
            "y": 12,
            "colSpan": 4,
            "rowSpan": 2
          },
          "metadata": {
            "inputs": [
              {
                "name": "options",
                "isOptional": true
              },
              {
                "name": "sharedTimeRange",
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${api_service_plan}"
                        },
                        "name": "CpuPercentage",
                        "aggregationType": 3,
                        "namespace": "microsoft.web/serverfarms",
                        "metricVisualization": {
                          "displayName": "CPU Percentage",
                          "resourceDisplayName": "ts-p-itn-api-asp-01"
                        }
                      },
                      {
                        "resourceMetadata": {
                          "id": "${api_service_plan}"
                        },
                        "name": "MemoryPercentage",
                        "aggregationType": 3,
                        "namespace": "microsoft.web/serverfarms",
                        "metricVisualization": {
                          "displayName": "Memory Percentage",
                          "resourceDisplayName": "ts-p-itn-api-asp-01"
                        }
                      }
                    ],
                    "title": "api-func CPU - Memory",
                    "titleKind": 2,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      },
                      "disablePinning": true
                    }
                  }
                }
              }
            }
          }
        },
        "22": {
          "position": {
            "x": 4,
            "y": 12,
            "colSpan": 4,
            "rowSpan": 2
          },
          "metadata": {
            "inputs": [
              {
                "name": "options",
                "isOptional": true
              },
              {
                "name": "sharedTimeRange",
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${consumers_service_plan}"
                        },
                        "name": "CpuPercentage",
                        "aggregationType": 3,
                        "namespace": "microsoft.web/serverfarms",
                        "metricVisualization": {
                          "displayName": "CPU Percentage",
                          "resourceDisplayName": "ts-p-itn-consumers-asp-01"
                        }
                      },
                      {
                        "resourceMetadata": {
                          "id": "${consumers_service_plan}"
                        },
                        "name": "MemoryPercentage",
                        "aggregationType": 3,
                        "namespace": "microsoft.web/serverfarms",
                        "metricVisualization": {
                          "displayName": "Memory Percentage",
                          "resourceDisplayName": "ts-p-itn-consumers-asp-01"
                        }
                      }
                    ],
                    "title": "consumers-func CPU - Memory",
                    "titleKind": 2,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      },
                      "disablePinning": true
                    }
                  }
                }
              }
            }
          }
        },
        "23": {
          "position": {
            "x": 8,
            "y": 12,
            "colSpan": 4,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "options",
                "isOptional": true
              },
              {
                "name": "sharedTimeRange",
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${servicebus_namespace}"
                        },
                        "name": "IncomingMessages",
                        "aggregationType": 1,
                        "namespace": "microsoft.servicebus/namespaces",
                        "metricVisualization": {
                          "displayName": "Incoming Messages",
                          "resourceDisplayName": "ts-p-itn-events-sbns-01"
                        }
                      },
                      {
                        "resourceMetadata": {
                          "id": "${servicebus_namespace}"
                        },
                        "name": "OutgoingMessages",
                        "aggregationType": 1,
                        "namespace": "microsoft.servicebus/namespaces",
                        "metricVisualization": {
                          "displayName": "Outgoing Messages",
                          "resourceDisplayName": "ts-p-itn-events-sbns-01"
                        }
                      }
                    ],
                    "title": "ServiceBus - Incoming / Outgoing Messages",
                    "titleKind": 2,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      },
                      "disablePinning": true
                    }
                  }
                }
              }
            }
          }
        },
        "24": {
          "position": {
            "x": 0,
            "y": 14,
            "colSpan": 4,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "options",
                "value": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${eventhub_namespace}"
                        },
                        "name": "IncomingMessages",
                        "aggregationType": 1,
                        "namespace": "microsoft.eventhub/namespaces",
                        "metricVisualization": {
                          "displayName": "Incoming Messages",
                          "resourceDisplayName": "ts-p-itn-main-evhns-01"
                        }
                      },
                      {
                        "resourceMetadata": {
                          "id": "${eventhub_namespace}"
                        },
                        "name": "OutgoingMessages",
                        "aggregationType": 1,
                        "namespace": "microsoft.eventhub/namespaces",
                        "metricVisualization": {
                          "displayName": "Outgoing Messages",
                          "resourceDisplayName": "ts-p-itn-main-evhns-01"
                        }
                      }
                    ],
                    "title": "Sum Incoming Messages and Sum Outgoing Messages for ts-p-itn-main-evhns-01",
                    "titleKind": 1,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      }
                    },
                    "timespan": {
                      "relative": {
                        "duration": 1800000
                      },
                      "showUTCTime": false,
                      "grain": 1
                    }
                  }
                },
                "isOptional": true
              },
              {
                "name": "sharedTimeRange",
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${eventhub_namespace}"
                        },
                        "name": "IncomingMessages",
                        "aggregationType": 1,
                        "namespace": "microsoft.eventhub/namespaces",
                        "metricVisualization": {
                          "displayName": "Incoming Messages",
                          "resourceDisplayName": "ts-p-itn-main-evhns-01"
                        }
                      },
                      {
                        "resourceMetadata": {
                          "id": "${eventhub_namespace}"
                        },
                        "name": "OutgoingMessages",
                        "aggregationType": 1,
                        "namespace": "microsoft.eventhub/namespaces",
                        "metricVisualization": {
                          "displayName": "Outgoing Messages",
                          "resourceDisplayName": "ts-p-itn-main-evhns-01"
                        }
                      }
                    ],
                    "title": "EventHub - Incoming / Outgoing Messages",
                    "titleKind": 2,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      },
                      "disablePinning": true
                    }
                  }
                }
              }
            }
          }
        },
        "25": {
          "position": {
            "x": 4,
            "y": 14,
            "colSpan": 4,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "options",
                "value": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${eventhub_namespace}"
                        },
                        "name": "ThrottledRequests",
                        "aggregationType": 1,
                        "namespace": "microsoft.eventhub/namespaces",
                        "metricVisualization": {
                          "displayName": "Throttled Requests.",
                          "resourceDisplayName": "ts-p-itn-main-evhns-01"
                        }
                      }
                    ],
                    "title": "Sum Throttled Requests. for ts-p-itn-main-evhns-01",
                    "titleKind": 1,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      }
                    },
                    "timespan": {
                      "relative": {
                        "duration": 1800000
                      },
                      "showUTCTime": false,
                      "grain": 1
                    }
                  }
                },
                "isOptional": true
              },
              {
                "name": "sharedTimeRange",
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${eventhub_namespace}"
                        },
                        "name": "ThrottledRequests",
                        "aggregationType": 1,
                        "namespace": "microsoft.eventhub/namespaces",
                        "metricVisualization": {
                          "displayName": "Throttled Requests.",
                          "resourceDisplayName": "ts-p-itn-main-evhns-01"
                        }
                      }
                    ],
                    "title": "EvenHub - Throttled Requests",
                    "titleKind": 2,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      },
                      "disablePinning": true
                    }
                  }
                }
              }
            }
          }
        },
        "26": {
          "position": {
            "x": 8,
            "y": 15,
            "colSpan": 4,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "options",
                "isOptional": true
              },
              {
                "name": "sharedTimeRange",
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${application_insights}"
                        },
                        "name": "customMetrics/getSubscription Successes",
                        "aggregationType": 1,
                        "namespace": "microsoft.insights/components/kusto",
                        "metricVisualization": {
                          "displayName": "getSubscription Successes"
                        }
                      },
                      {
                        "resourceMetadata": {
                          "id": "${application_insights}"
                        },
                        "name": "customMetrics/getSubscription Failures",
                        "aggregationType": 1,
                        "namespace": "microsoft.insights/components/kusto",
                        "metricVisualization": {
                          "displayName": "getSubscription Failures"
                        }
                      }
                    ],
                    "title": "getSubscription Successes/Failure",
                    "titleKind": 2,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      },
                      "disablePinning": true
                    }
                  }
                }
              }
            }
          }
        },
        "27": {
          "position": {
            "x": 0,
            "y": 17,
            "colSpan": 4,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "options",
                "isOptional": true
              },
              {
                "name": "sharedTimeRange",
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${application_insights}"
                        },
                        "name": "customMetrics/subscriptionRequestConsumer Successes",
                        "aggregationType": 1,
                        "namespace": "microsoft.insights/components/kusto",
                        "metricVisualization": {
                          "displayName": "subscriptionRequestConsumer Successes"
                        }
                      },
                      {
                        "resourceMetadata": {
                          "id": "${application_insights}"
                        },
                        "name": "customMetrics/subscriptionRequestConsumer Failures",
                        "aggregationType": 1,
                        "namespace": "microsoft.insights/components/kusto",
                        "metricVisualization": {
                          "displayName": "subscriptionRequestConsumer Failures"
                        }
                      }
                    ],
                    "title": "subscriptionRequestConsumer Successes/Failures",
                    "titleKind": 2,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      },
                      "disablePinning": true
                    }
                  }
                }
              }
            }
          }
        },
        "28": {
          "position": {
            "x": 4,
            "y": 17,
            "colSpan": 4,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "options",
                "isOptional": true
              },
              {
                "name": "sharedTimeRange",
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${application_insights}"
                        },
                        "name": "customMetrics/activationConsumer Successes",
                        "aggregationType": 1,
                        "namespace": "microsoft.insights/components/kusto",
                        "metricVisualization": {
                          "displayName": "activationConsumer Successes"
                        }
                      },
                      {
                        "resourceMetadata": {
                          "id": "${application_insights}"
                        },
                        "name": "customMetrics/activationConsumer Failures",
                        "aggregationType": 1,
                        "namespace": "microsoft.insights/components/kusto",
                        "metricVisualization": {
                          "displayName": "activationConsumer Failures"
                        }
                      }
                    ],
                    "title": "activationConsumer Successes/Failures",
                    "titleKind": 2,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      },
                      "disablePinning": true
                    }
                  }
                }
              }
            }
          }
        },
        "29": {
          "position": {
            "x": 8,
            "y": 18,
            "colSpan": 4,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "options",
                "isOptional": true
              },
              {
                "name": "sharedTimeRange",
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${application_insights}"
                        },
                        "name": "customMetrics/createSubscription Successes",
                        "aggregationType": 1,
                        "namespace": "microsoft.insights/components/kusto",
                        "metricVisualization": {
                          "displayName": "createSubscription Successes"
                        }
                      },
                      {
                        "resourceMetadata": {
                          "id": "${application_insights}"
                        },
                        "name": "customMetrics/createSubscription Failures",
                        "aggregationType": 1,
                        "namespace": "microsoft.insights/components/kusto",
                        "metricVisualization": {
                          "displayName": "createSubscription Failures"
                        }
                      }
                    ],
                    "title": "createSubscription Successes/Failures",
                    "titleKind": 2,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      },
                      "disablePinning": true
                    }
                  }
                }
              }
            }
          }
        },
        "30": {
          "position": {
            "x": 0,
            "y": 20,
            "colSpan": 4,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "options",
                "isOptional": true
              },
              {
                "name": "sharedTimeRange",
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${application_insights}"
                        },
                        "name": "customMetrics/subscriptionHistoryConsumer Successes",
                        "aggregationType": 1,
                        "namespace": "microsoft.insights/components/kusto",
                        "metricVisualization": {
                          "displayName": "subscriptionHistoryConsumer Successes"
                        }
                      },
                      {
                        "resourceMetadata": {
                          "id": "${application_insights}"
                        },
                        "name": "customMetrics/subscriptionHistoryConsumer Failures",
                        "aggregationType": 1,
                        "namespace": "microsoft.insights/components/kusto",
                        "metricVisualization": {
                          "displayName": "subscriptionHistoryConsumer Failures"
                        }
                      }
                    ],
                    "title": "subscriptionHistoryConsumer Successes/Failures",
                    "titleKind": 2,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      },
                      "disablePinning": true
                    }
                  }
                }
              }
            }
          }
        },
        "31": {
          "position": {
            "x": 4,
            "y": 20,
            "colSpan": 4,
            "rowSpan": 3
          },
          "metadata": {
            "inputs": [
              {
                "name": "options",
                "isOptional": true
              },
              {
                "name": "sharedTimeRange",
                "isOptional": true
              }
            ],
            "type": "Extension/HubsExtension/PartType/MonitorChartPart",
            "settings": {
              "content": {
                "options": {
                  "chart": {
                    "metrics": [
                      {
                        "resourceMetadata": {
                          "id": "${application_insights}"
                        },
                        "name": "customMetrics/eventProducer Successes",
                        "aggregationType": 1,
                        "namespace": "microsoft.insights/components/kusto",
                        "metricVisualization": {
                          "displayName": "eventProducer Successes"
                        }
                      },
                      {
                        "resourceMetadata": {
                          "id": "${application_insights}"
                        },
                        "name": "customMetrics/eventProducer Failures",
                        "aggregationType": 1,
                        "namespace": "microsoft.insights/components/kusto",
                        "metricVisualization": {
                          "displayName": "eventProducer Failures"
                        }
                      }
                    ],
                    "title": "eventProducer Successes/Failures",
                    "titleKind": 2,
                    "visualization": {
                      "chartType": 2,
                      "legendVisualization": {
                        "isVisible": true,
                        "position": 2,
                        "hideHoverCard": false,
                        "hideLabelNames": true
                      },
                      "axisVisualization": {
                        "x": {
                          "isVisible": true,
                          "axisType": 2
                        },
                        "y": {
                          "isVisible": true,
                          "axisType": 1
                        }
                      },
                      "disablePinning": true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "metadata": {
    "model": {
      "timeRange": {
        "value": {
          "relative": {
            "duration": 24,
            "timeUnit": 1
          }
        },
        "type": "MsPortalFx.Composition.Configuration.ValueTypes.TimeRange"
      },
      "filterLocale": {
        "value": "en-us"
      },
      "filters": {
        "value": {
          "MsPortalFx_TimeRange": {
            "model": {
              "format": "local",
              "granularity": "auto",
              "relative": "30m"
            },
            "displayCache": {
              "name": "Local Time",
              "value": "Past 30 minutes"
            },
            "filteredPartIds": [
              "StartboardPart-MonitorChartPart-5a90892a-7953-419c-a037-a8d44255b012",
              "StartboardPart-MonitorChartPart-5a90892a-7953-419c-a037-a8d44255b014",
              "StartboardPart-MonitorChartPart-5a90892a-7953-419c-a037-a8d44255b016",
              "StartboardPart-MonitorChartPart-5a90892a-7953-419c-a037-a8d44255b018",
              "StartboardPart-MonitorChartPart-5a90892a-7953-419c-a037-a8d44255b01a",
              "StartboardPart-MonitorChartPart-5a90892a-7953-419c-a037-a8d44255b01c",
              "StartboardPart-MonitorChartPart-5a90892a-7953-419c-a037-a8d44255b020",
              "StartboardPart-MonitorChartPart-5a90892a-7953-419c-a037-a8d44255b022",
              "StartboardPart-MonitorChartPart-5a90892a-7953-419c-a037-a8d44255b024",
              "StartboardPart-MonitorChartPart-5a90892a-7953-419c-a037-a8d44255b026",
              "StartboardPart-MonitorChartPart-5a90892a-7953-419c-a037-a8d44255b028",
              "StartboardPart-MonitorChartPart-5a90892a-7953-419c-a037-a8d44255b02a",
              "StartboardPart-MonitorChartPart-5a90892a-7953-419c-a037-a8d44255b02c",
              "StartboardPart-MonitorChartPart-5a90892a-7953-419c-a037-a8d44255b030",
              "StartboardPart-MonitorChartPart-5a90892a-7953-419c-a037-a8d44255b032",
              "StartboardPart-MonitorChartPart-5a90892a-7953-419c-a037-a8d44255b034",
              "StartboardPart-MonitorChartPart-5a90892a-7953-419c-a037-a8d44255b036",
              "StartboardPart-MonitorChartPart-5a90892a-7953-419c-a037-a8d44255b038",
              "StartboardPart-MonitorChartPart-5a90892a-7953-419c-a037-a8d44255b03a",
              "StartboardPart-MonitorChartPart-5a90892a-7953-419c-a037-a8d44255b03c",
              "StartboardPart-MonitorChartPart-5a90892a-7953-419c-a037-a8d44255b03e",
              "StartboardPart-MonitorChartPart-5a90892a-7953-419c-a037-a8d44255b040",
              "StartboardPart-MonitorChartPart-5a90892a-7953-419c-a037-a8d44255b042",
              "StartboardPart-LogsDashboardPart-5a90892a-7953-419c-a037-a8d44255b044",
              "StartboardPart-LogsDashboardPart-5a90892a-7953-419c-a037-a8d44255b046",
              "StartboardPart-LogsDashboardPart-5a90892a-7953-419c-a037-a8d44255b048",
              "StartboardPart-LogsDashboardPart-5a90892a-7953-419c-a037-a8d44255b04a"
            ]
          }
        }
      }
    }
  },
  "name": "${title}",
  "type": "Microsoft.Portal/dashboards",
  "location": "INSERT LOCATION",
  "tags": {
    "hidden-title": "${title}"
  },
  "apiVersion": "2015-08-01-preview"
}
