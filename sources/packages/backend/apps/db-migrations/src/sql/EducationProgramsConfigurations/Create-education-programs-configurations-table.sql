CREATE TABLE sims.education_programs_configurations (
    id SERIAL PRIMARY KEY,
    visual_schema JSONB NOT NULL,
    validation_schema JSONB NOT NULL,
    program_year_id INT REFERENCES sims.program_years(id) NOT NULL,
    is_active BOOLEAN NOT NULL,
    -- Audit columns.
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Ensures only one active configuration exists per program year.
CREATE UNIQUE INDEX education_programs_configurations_unique_active_per_program_year ON sims.education_programs_configurations(program_year_id)
WHERE
    is_active;

COMMENT ON INDEX sims.education_programs_configurations_unique_active_per_program_year IS 'Enforces that only one active configuration can exist for a program year at any given time.';

-- Populate initial values for all program years.
INSERT INTO
    sims.education_programs_configurations (
        visual_schema,
        validation_schema,
        program_year_id,
        is_active
    )
SELECT
    $$
    {
      "type": "VerticalLayout",
      "elements": [
        {
          "type": "Group",
          "label": "Program details",
          "elements": [
            {
              "type": "VerticalLayout",
              "elements": [
                {
                  "type": "Control",
                  "scope": "#/properties/name"
                },
                {
                  "type": "Control",
                  "scope": "#/properties/description",
                  "options": {
                    "multiline": true
                  }
                },
                {
                  "type": "Control",
                  "scope": "#/properties/credentialType",
                  "options": {
                    "component": "select"
                  }
                },
                {
                  "type": "Control",
                  "scope": "#/properties/cipCode",
                  "options": {
                    "hint": "Format (##.####)"
                  }
                },
                {
                  "type": "Control",
                  "scope": "#/properties/fieldOfStudyCode"
                },
                {
                  "type": "Control",
                  "scope": "#/properties/nocCode",
                  "options": {
                    "hint": "Format (#####) Optional**"
                  }
                },
                {
                  "type": "Control",
                  "scope": "#/properties/sabcCode",
                  "options": {
                    "hint": "Format (XXX#) Mandatory field if using the 'Offerings Upload' feature. Otherwise optional."
                  }
                },
                {
                  "type": "Control",
                  "scope": "#/properties/institutionProgramCode"
                }
              ]
            }
          ]
        },
        {
          "type": "Group",
          "label": "Program eligibility",
          "elements": [
            {
              "type": "VerticalLayout",
              "elements": [
                {
                  "type": "Control",
                  "scope": "#/properties/programIntensity",
                  "options": {
                    "tooltip": "A part-time program has a course load between 20 and 59%. A full-time program must have a course load of: 60% or greater or Between 40 and 60% for students with a permanent disability.",
                    "component": "radio"
                  }
                },
                {
                  "type": "Control",
                  "scope": "#/properties/programDeliveryTypes"
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "type": "AND",
                      "conditions": [
                        {
                          "scope": "#/properties/isBCPrivate",
                          "schema": {
                            "const": true
                          }
                        },
                        {
                          "scope": "#/properties/programDeliveryTypes",
                          "schema": {
                            "contains": {
                              "const": "deliveredOnline"
                            }
                          }
                        },
                        {
                          "scope": "#/properties/programDeliveryTypes",
                          "schema": {
                            "not": {
                              "contains": {
                                "const": "deliveredOnSite"
                              }
                            }
                          }
                        }
                      ]
                    }
                  },
                  "type": "Label",
                  "options": {
                    "header": "This program requires review by StudentAid BC to determine eligibility."
                  }
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "type": "AND",
                      "conditions": [
                        {
                          "scope": "#/properties/isBCInstitution",
                          "schema": {
                            "const": false
                          }
                        },
                        {
                          "scope": "#/properties/programDeliveryTypes",
                          "schema": {
                            "contains": {
                              "const": "deliveredOnline"
                            }
                          }
                        }
                      ]
                    }
                  },
                  "type": "Control",
                  "scope": "#/properties/deliveredOnlineAlsoOnsite"
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "type": "AND",
                      "conditions": [
                        {
                          "scope": "#/properties/isBCInstitution",
                          "schema": {
                            "const": false
                          }
                        },
                        {
                          "scope": "#/properties/deliveredOnlineAlsoOnsite",
                          "schema": {
                            "const": "no"
                          }
                        }
                      ]
                    }
                  },
                  "type": "Control",
                  "scope": "#/properties/sameOnlineCreditsEarned"
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "type": "AND",
                      "conditions": [
                        {
                          "scope": "#/properties/isBCInstitution",
                          "schema": {
                            "const": false
                          }
                        },
                        {
                          "scope": "#/properties/deliveredOnlineAlsoOnsite",
                          "schema": {
                            "const": "no"
                          }
                        },
                        {
                          "scope": "#/properties/sameOnlineCreditsEarned",
                          "schema": {
                            "const": "no"
                          }
                        }
                      ]
                    }
                  },
                  "type": "Control",
                  "scope": "#/properties/earnAcademicCreditsOtherInstitution"
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "type": "AND",
                      "conditions": [
                        {
                          "scope": "#/properties/isBCInstitution",
                          "schema": {
                            "const": false
                          }
                        },
                        {
                          "scope": "#/properties/deliveredOnlineAlsoOnsite",
                          "schema": {
                            "const": "no"
                          }
                        },
                        {
                          "scope": "#/properties/sameOnlineCreditsEarned",
                          "schema": {
                            "const": "no"
                          }
                        },
                        {
                          "scope": "#/properties/earnAcademicCreditsOtherInstitution",
                          "schema": {
                            "const": "no"
                          }
                        }
                      ]
                    }
                  },
                  "type": "Label"
                },
                {
                  "type": "Control",
                  "scope": "#/properties/completionYears",
                  "options": {
                    "hint": "This qualifies students for specific funds or grants.",
                    "component": "select"
                  }
                },
                {
                  "type": "Control",
                  "scope": "#/properties/courseLoadCalculation",
                  "options": {
                    "component": "radio"
                  }
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "scope": "#/properties/courseLoadCalculation",
                      "schema": {
                        "const": "hours"
                      }
                    }
                  },
                  "type": "Control",
                  "scope": "#/properties/minHoursWeek"
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "type": "AND",
                      "conditions": [
                        {
                          "scope": "#/properties/courseLoadCalculation",
                          "schema": {
                            "const": "hours"
                          }
                        },
                        {
                          "scope": "#/properties/minHoursWeek",
                          "schema": {
                            "const": "no"
                          }
                        },
                        {
                          "scope": "#/properties/isAviationProgram",
                          "schema": {
                            "const": "no"
                          }
                        }
                      ]
                    }
                  },
                  "type": "Label",
                  "options": {
                    "summary": "The program needs to be a minimum of 20 instructional hours."
                  }
                },
                {
                  "type": "Control",
                  "scope": "#/properties/regulatoryBody",
                  "options": {
                    "hint": "All programs must be approved by your regulatory body to meet the criteria. If your program has not been approved yet, please contact your regulatory body first.",
                    "component": "select"
                  }
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "scope": "#/properties/regulatoryBody",
                      "schema": {
                        "const": "other"
                      }
                    }
                  },
                  "type": "Control",
                  "scope": "#/properties/otherRegulatoryBody"
                }
              ]
            }
          ]
        },
        {
          "type": "Group",
          "label": "Entrance requirements",
          "elements": [
            {
              "type": "VerticalLayout",
              "elements": [
                {
                  "type": "Control",
                  "scope": "#/properties/entranceRequirements"
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "scope": "#/properties/entranceRequirements",
                      "schema": {
                        "type": "array",
                        "contains": {
                          "const": "noneOfTheAboveEntranceRequirements"
                        }
                      }
                    }
                  },
                  "type": "Label",
                  "options": {
                    "summary": "An entrance requirement is required."
                  }
                }
              ]
            }
          ]
        },
        {
          "type": "Group",
          "label": "English as a Second Language (ESL) content",
          "elements": [
            {
              "type": "VerticalLayout",
              "elements": [
                {
                  "type": "Control",
                  "scope": "#/properties/eslEligibility",
                  "options": {
                    "component": "radio"
                  }
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "scope": "#/properties/eslEligibility",
                      "schema": {
                        "const": "20OrMore"
                      }
                    }
                  },
                  "type": "Label",
                  "options": {
                    "summary": "ESL can't exceed 20% of course content."
                  }
                }
              ]
            }
          ]
        },
        {
          "type": "Group",
          "label": "Program partnerships",
          "options": {
            "subtitleHtml": "If this program is offered at a partner institution, that institution must also be designated by SABC. Find out which institutions are designated on <a href=\"https://studentaidbc.ca/\" target=\"_blank\" rel=\"noopener noreferrer\">StudentAidBC.ca</a>."
          },
          "elements": [
            {
              "type": "VerticalLayout",
              "elements": [
                {
                  "type": "Control",
                  "scope": "#/properties/hasJointInstitution"
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "scope": "#/properties/hasJointInstitution",
                      "schema": {
                        "const": "yes"
                      }
                    }
                  },
                  "type": "Control",
                  "scope": "#/properties/hasJointDesignatedInstitution"
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "scope": "#/properties/hasJointDesignatedInstitution",
                      "schema": {
                        "const": "yes"
                      }
                    }
                  },
                  "type": "Label",
                  "options": {
                    "header": "Partner program review",
                    "contentHtml": "This program requires additional review by StudentAid BC. Please email <a href=\"mailto:designat@gov.bc.ca\">designat@gov.bc.ca</a> the name of the institution that you have partnered with, the name of this program, and any other details you want included as part of the review for this program."
                  }
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "scope": "#/properties/hasJointDesignatedInstitution",
                      "schema": {
                        "const": "no"
                      }
                    }
                  },
                  "type": "Label",
                  "options": {
                    "summary": "All partner institutions must be designated by StudentAid BC."
                  }
                }
              ]
            }
          ]
        },
        {
          "type": "Group",
          "label": "Work-integrated learning (WIL)",
          "elements": [
            {
              "type": "VerticalLayout",
              "elements": [
                {
                  "type": "Control",
                  "scope": "#/properties/hasWILComponent"
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "scope": "#/properties/hasWILComponent",
                      "schema": {
                        "const": "yes"
                      }
                    }
                  },
                  "type": "Control",
                  "scope": "#/properties/isWILApproved"
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "type": "AND",
                      "conditions": [
                        {
                          "scope": "#/properties/hasWILComponent",
                          "schema": {
                            "const": "yes"
                          }
                        },
                        {
                          "scope": "#/properties/isWILApproved",
                          "schema": {
                            "const": "no"
                          }
                        }
                      ]
                    }
                  },
                  "type": "Label",
                  "options": {
                    "summary": "The work-integrated learning component must be approved by your regulator or oversight body first."
                  }
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "type": "AND",
                      "conditions": [
                        {
                          "scope": "#/properties/hasWILComponent",
                          "schema": {
                            "const": "yes"
                          }
                        },
                        {
                          "scope": "#/properties/isWILApproved",
                          "schema": {
                            "const": "yes"
                          }
                        }
                      ]
                    }
                  },
                  "type": "Control",
                  "scope": "#/properties/wilProgramEligibility",
                  "options": {
                    "tooltipHtml": "<span>For the work-integrated learning experience to qualify for student financial assistance it must be:</span><ul class=\"ps-3\"><li>Required for graduation (in the case of a co-op education placement it must either be required for graduation and/or result in a credential with a co-op designation);</li><li>Linked to the curriculum; and</li><li>Not exceed 50% of the program (or no more than 20% for practicums and 10% for preceptorships) unless otherwise regulated as a requirement by an oversight body (e.g., Early Childhood Educators (ECE) Registry).</li></ul>"
                  }
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "type": "AND",
                      "conditions": [
                        {
                          "scope": "#/properties/hasWILComponent",
                          "schema": {
                            "const": "yes"
                          }
                        },
                        {
                          "scope": "#/properties/isWILApproved",
                          "schema": {
                            "const": "yes"
                          }
                        },
                        {
                          "scope": "#/properties/wilProgramEligibility",
                          "schema": {
                            "const": "no"
                          }
                        }
                      ]
                    }
                  },
                  "type": "Label",
                  "options": {
                    "summary": "This must meet the StudentAid BC policy."
                  }
                }
              ]
            }
          ]
        },
        {
          "type": "Group",
          "label": "Field trip, field placement, or travel",
          "elements": [
            {
              "type": "VerticalLayout",
              "elements": [
                {
                  "type": "Control",
                  "scope": "#/properties/hasTravel"
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "scope": "#/properties/hasTravel",
                      "schema": {
                        "const": "yes"
                      }
                    }
                  },
                  "type": "Control",
                  "scope": "#/properties/travelProgramEligibility"
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "type": "AND",
                      "conditions": [
                        {
                          "scope": "#/properties/hasTravel",
                          "schema": {
                            "const": "yes"
                          }
                        },
                        {
                          "scope": "#/properties/travelProgramEligibility",
                          "schema": {
                            "const": "no"
                          }
                        }
                      ]
                    }
                  },
                  "type": "Label",
                  "options": {
                    "summary": "This must meet the StudentAid BC policy."
                  }
                }
              ]
            }
          ]
        },
        {
          "type": "Group",
          "label": "International exchange",
          "elements": [
            {
              "type": "VerticalLayout",
              "elements": [
                {
                  "type": "Control",
                  "scope": "#/properties/hasIntlExchange"
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "scope": "#/properties/hasIntlExchange",
                      "schema": {
                        "const": "yes"
                      }
                    }
                  },
                  "type": "Control",
                  "scope": "#/properties/intlExchangeProgramEligibility"
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "type": "AND",
                      "conditions": [
                        {
                          "scope": "#/properties/hasIntlExchange",
                          "schema": {
                            "const": "yes"
                          }
                        },
                        {
                          "scope": "#/properties/intlExchangeProgramEligibility",
                          "schema": {
                            "const": "no"
                          }
                        }
                      ]
                    }
                  },
                  "type": "Label",
                  "options": {
                    "summary": "This must meet the StudentAid BC policy."
                  }
                }
              ]
            }
          ]
        },
        {
          "type": "Group",
          "label": "Aviation",
          "elements": [
            {
              "type": "VerticalLayout",
              "elements": [
                {
                  "type": "Control",
                  "scope": "#/properties/isAviationProgram"
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "scope": "#/properties/isAviationProgram",
                      "schema": {
                        "const": "yes"
                      }
                    }
                  },
                  "type": "Control",
                  "scope": "#/properties/credentialTypesAviation",
                  "options": {
                    "component": "checkboxOptionsGroup"
                  }
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "scope": "#/properties/credentialTypesAviation",
                      "schema": {
                        "type": "array",
                        "contains": {
                          "const": "privatePilotTraining"
                        }
                      }
                    }
                  },
                  "type": "Label",
                  "options": {
                    "summary": "StudentAid BC does not provide any assistance to students for Private Pilot Training."
                  }
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "scope": "#/properties/isAviationProgram",
                      "schema": {
                        "const": "yes"
                      }
                    }
                  },
                  "type": "Control",
                  "scope": "#/properties/minHoursWeekAvi"
                },
                {
                  "rule": {
                    "effect": "SHOW",
                    "condition": {
                      "scope": "#/properties/minHoursWeekAvi",
                      "schema": {
                        "const": "no"
                      }
                    }
                  },
                  "type": "Label",
                  "options": {
                    "summary": "The aviation program needs to be a minimum of 15 instructional hours."
                  }
                }
              ]
            }
          ]
        },
        {
          "type": "Group",
          "label": "Declaration",
          "elements": [
            {
              "type": "VerticalLayout",
              "elements": [
                {
                  "type": "Label",
                  "options": {
                    "plainText": "All information is subject to verification and auditing."
                  }
                },
                {
                  "type": "Control",
                  "label": "I confirm this program meets the policies outlined in the StudentAid BC policy manual.",
                  "scope": "#/properties/programDeclaration"
                }
              ]
            }
          ]
        }
      ]
    }
    $$ :: jsonb AS visual_schema,
    $$
    {
        "type": "object",
        "allOf": [
            {
            "if": {
                "required": [
                "isBCInstitution",
                "programDeliveryTypes"
                ],
                "properties": {
                "isBCInstitution": {
                    "const": false
                },
                "programDeliveryTypes": {
                    "contains": {
                    "const": "deliveredOnline"
                    }
                }
                }
            },
            "then": {
                "required": [
                "deliveredOnlineAlsoOnsite"
                ],
                "errorMessage": {
                "required": "Please indicate if the program will also be offered and delivered at 100% course load on site."
                }
            }
            },
            {
            "if": {
                "required": [
                "isBCInstitution",
                "deliveredOnlineAlsoOnsite"
                ],
                "properties": {
                "isBCInstitution": {
                    "const": false
                },
                "deliveredOnlineAlsoOnsite": {
                    "const": "no"
                }
                }
            },
            "then": {
                "required": [
                "sameOnlineCreditsEarned"
                ],
                "errorMessage": {
                "required": "Please indicate if students will earn the same number of credits in the same time period."
                }
            }
            },
            {
            "if": {
                "required": [
                "isBCInstitution",
                "deliveredOnlineAlsoOnsite",
                "sameOnlineCreditsEarned"
                ],
                "properties": {
                "isBCInstitution": {
                    "const": false
                },
                "sameOnlineCreditsEarned": {
                    "const": "no"
                },
                "deliveredOnlineAlsoOnsite": {
                    "const": "no"
                }
                }
            },
            "then": {
                "required": [
                "earnAcademicCreditsOtherInstitution"
                ],
                "errorMessage": {
                "required": "Please indicate if students will earn academic credits recognized at another designated institution."
                }
            }
            },
            {
            "if": {
                "required": [
                "courseLoadCalculation"
                ],
                "properties": {
                "courseLoadCalculation": {
                    "const": "hours"
                }
                }
            },
            "then": {
                "required": [
                "minHoursWeek"
                ],
                "errorMessage": {
                "required": "Please indicate if this program includes a minimum of 20 instructional hours per week."
                }
            }
            },
            {
            "if": {
                "required": [
                "regulatoryBody"
                ],
                "properties": {
                "regulatoryBody": {
                    "const": "other"
                }
                }
            },
            "then": {
                "required": [
                "otherRegulatoryBody"
                ],
                "errorMessage": {
                "required": "Please specify the other institution regulatory body."
                }
            }
            },
            {
            "if": {
                "required": [
                "hasJointInstitution"
                ],
                "properties": {
                "hasJointInstitution": {
                    "const": "yes"
                }
                }
            },
            "then": {
                "required": [
                "hasJointDesignatedInstitution"
                ],
                "errorMessage": {
                "required": "Please indicate if all partner institutions are designated by StudentAid BC."
                }
            }
            },
            {
            "if": {
                "required": [
                "hasWILComponent"
                ],
                "properties": {
                "hasWILComponent": {
                    "const": "yes"
                }
                }
            },
            "then": {
                "required": [
                "isWILApproved"
                ],
                "errorMessage": {
                "required": "Please indicate if the WIL is approved by your regulator or oversight body."
                }
            }
            },
            {
            "if": {
                "required": [
                "hasWILComponent",
                "isWILApproved"
                ],
                "properties": {
                "isWILApproved": {
                    "const": "yes"
                },
                "hasWILComponent": {
                    "const": "yes"
                }
                }
            },
            "then": {
                "required": [
                "wilProgramEligibility"
                ],
                "errorMessage": {
                "required": "Please indicate if the WIL meets the program eligibility requirements."
                }
            }
            },
            {
            "if": {
                "required": [
                "hasTravel"
                ],
                "properties": {
                "hasTravel": {
                    "const": "yes"
                }
                }
            },
            "then": {
                "required": [
                "travelProgramEligibility"
                ],
                "errorMessage": {
                "required": "Please indicate if the field trip, field placement, or travel meets the program eligibility requirements."
                }
            }
            },
            {
            "if": {
                "required": [
                "hasIntlExchange"
                ],
                "properties": {
                "hasIntlExchange": {
                    "const": "yes"
                }
                }
            },
            "then": {
                "required": [
                "intlExchangeProgramEligibility"
                ],
                "errorMessage": {
                "required": "Please indicate if the international exchange meets the program eligibility requirements."
                }
            }
            },
            {
            "if": {
                "required": [
                "isAviationProgram"
                ],
                "properties": {
                "isAviationProgram": {
                    "const": "yes"
                }
                }
            },
            "then": {
                "required": [
                "credentialTypesAviation",
                "minHoursWeekAvi"
                ],
                "errorMessage": {
                "required": "Please select at least one credential type and indicate if the program includes a minimum of 15 instructional hours per week."
                }
            }
            }
        ],
        "required": [
            "name",
            "credentialType",
            "cipCode",
            "programIntensity",
            "programDeliveryTypes",
            "completionYears",
            "courseLoadCalculation",
            "regulatoryBody",
            "entranceRequirements",
            "eslEligibility",
            "hasJointInstitution",
            "hasWILComponent",
            "hasTravel",
            "hasIntlExchange",
            "isAviationProgram"
        ],
        "properties": {
            "name": {
            "type": "string",
            "title": "Program name",
            "maxLength": 300
            },
            "cipCode": {
            "type": "string",
            "title": "Classification of Instructional Programs (CIP)",
            "pattern": "^\\d{2}\\.\\d{4}$",
            "errorMessage": {
                "pattern": "Classification of Instructional Programs (CIP) format is invalid."
            }
            },
            "nocCode": {
            "type": "string",
            "title": "National Occupational Classification (NOC)",
            "pattern": "^$|^\\d{5}$",
            "errorMessage": {
                "pattern": "National Occupational Classification (NOC) format is invalid."
            }
            },
            "sabcCode": {
            "type": "string",
            "title": "SABC program code",
            "pattern": "^$|^[A-Z]{3}\\d$",
            "errorMessage": {
                "pattern": "SABC program code format is invalid."
            }
            },
            "hasTravel": {
            "enum": [
                "yes",
                "no"
            ],
            "type": "string",
            "title": "Is a field trip, field placement or travel part of this program?",
            "format": "yesNo"
            },
            "description": {
            "type": "string",
            "title": "Program description",
            "maxLength": 500
            },
            "isBCPrivate": {
            "type": "boolean"
            },
            "minHoursWeek": {
            "enum": [
                "yes",
                "no"
            ],
            "type": "string",
            "title": "Does this program include a minimum of 20 instructional hours per week?",
            "format": "yesNo"
            },
            "isWILApproved": {
            "enum": [
                "yes",
                "no"
            ],
            "type": "string",
            "title": "Is the WIL approved by your regulator or oversight body?",
            "format": "yesNo"
            },
            "credentialType": {
            "oneOf": [
                {
                "const": "undergraduateCertificate",
                "title": "Undergraduate Certificate"
                },
                {
                "const": "undergraduateCitation",
                "title": "Undergraduate Citation"
                },
                {
                "const": "undergraduateDiploma",
                "title": "Undergraduate Diploma"
                },
                {
                "const": "undergraduateDegree",
                "title": "Undergraduate Degree"
                },
                {
                "const": "graduateCertificate",
                "title": "Graduate Certificate"
                },
                {
                "const": "graduateDiploma",
                "title": "Graduate Diploma"
                },
                {
                "const": "graduateDegreeOrMasters",
                "title": "Graduate Degree / Master's"
                },
                {
                "const": "postGraduateOrDoctorate",
                "title": "Post-Graduate / Doctorate"
                },
                {
                "const": "qualifyingStudies",
                "title": "Qualifying Studies"
                }
            ],
            "title": "Credential type"
            },
            "eslEligibility": {
            "oneOf": [
                {
                "const": "lessThan20",
                "title": "Less than 20%"
                },
                {
                "const": "20OrMore",
                "title": "20% or more"
                }
            ],
            "title": "What percentage of the program has ESL Content?"
            },
            "regulatoryBody": {
            "oneOf": [
                {
                "const": "ptiru",
                "title": "PTIRU"
                },
                {
                "const": "dqab",
                "title": "DQAB"
                },
                {
                "const": "privateActLegislature",
                "title": "Private Act of B.C. Legislature"
                },
                {
                "const": "skilledTradesBC",
                "title": "Skilled Trades BC"
                },
                {
                "const": "icbc",
                "title": "ICBC"
                },
                {
                "const": "senateOrEducationCouncil",
                "title": "Senate, Academic Council, Education Council, and/or Program Council and Board of Governors"
                },
                {
                "const": "other",
                "title": "Other"
                }
            ],
            "title": "Which regulatory body does this program belong to?"
            },
            "completionYears": {
            "oneOf": [
                {
                "const": "12WeeksTo52Weeks",
                "title": "12 weeks to 52 weeks"
                },
                {
                "const": "53WeeksTo59Weeks",
                "title": "53 weeks to 59 weeks"
                },
                {
                "const": "60WeeksToLessThan2Years",
                "title": "60 weeks to less than 2 years"
                },
                {
                "const": "2YearsToLessThan3Years",
                "title": "2 Years to less than 3Years"
                },
                {
                "const": "3YearsToLessThan4Years",
                "title": "3 Years to less than 4 Years"
                },
                {
                "const": "4YearsToLessThan5Years",
                "title": "4 Years to less than 5Years"
                },
                {
                "const": "5YearsOrMore",
                "title": "5 Years or More"
                }
            ],
            "title": "Program length"
            },
            "hasIntlExchange": {
            "enum": [
                "yes",
                "no"
            ],
            "type": "string",
            "title": "Does the program have an international exchange?",
            "format": "yesNo"
            },
            "hasWILComponent": {
            "enum": [
                "yes",
                "no"
            ],
            "type": "string",
            "title": "Does this program have a WIL component?",
            "format": "yesNo"
            },
            "isBCInstitution": {
            "type": "boolean"
            },
            "minHoursWeekAvi": {
            "enum": [
                "yes",
                "no"
            ],
            "type": "string",
            "title": "Does this program include a minimum of 15 instructional hours per week?",
            "format": "yesNo"
            },
            "fieldOfStudyCode": {
            "type": "number",
            "title": "Field of study code"
            },
            "programIntensity": {
            "oneOf": [
                {
                "const": "Full Time and Part Time",
                "title": "Yes"
                },
                {
                "const": "Full Time",
                "title": "No"
                }
            ],
            "title": "Are students able to take this on a part time basis?"
            },
            "isAviationProgram": {
            "enum": [
                "yes",
                "no"
            ],
            "type": "string",
            "title": "Does this program contain aviation?",
            "format": "yesNo"
            },
            "programDeclaration": {
            "type": "boolean",
            "const": true,
            "errorMessage": {
                "const": "You must confirm to proceed."
            }
            },
            "hasJointInstitution": {
            "enum": [
                "yes",
                "no"
            ],
            "type": "string",
            "title": "Is the program offered jointly or in partnership with other institutions?",
            "format": "yesNo"
            },
            "otherRegulatoryBody": {
            "type": "string",
            "title": "Other institution regulatory body",
            "maxLength": 100
            },
            "entranceRequirements": {
            "if": {
                "contains": {
                "const": "noneOfTheAboveEntranceRequirements"
                }
            },
            "then": {
                "maxItems": 1,
                "errorMessage": {
                "maxItems": "'None of the above' cannot be combined with other entrance requirements."
                }
            },
            "type": "array",
            "items": {
                "oneOf": [
                {
                    "const": "minHighSchool",
                    "title": "Students to have graduated from grade 12 or equivalent."
                },
                {
                    "const": "hasMinimumAge",
                    "title": "Students are 19 years old or older before the start of classes."
                },
                {
                    "const": "requirementsByInstitution",
                    "title": "For post-secondary level academic credit-based programs: This program has entrance requirements established by the institution that enable completion of the program of study."
                },
                {
                    "const": "requirementsByBCITA",
                    "title": "This program is approved by the SkilledTradesBC and students must meet the entrance requirements set by the B.C. ITA."
                },
                {
                    "const": "noneOfTheAboveEntranceRequirements",
                    "title": "None of the above"
                }
                ]
            },
            "title": "What are the entrance requirements for this program? (Select all that apply)",
            "minItems": 1,
            "errorMessage": {
                "minItems": "At least one entrance requirement must be selected."
            }
            },
            "programDeliveryTypes": {
            "type": "array",
            "items": {
                "oneOf": [
                {
                    "const": "deliveredOnSite",
                    "title": "On site"
                },
                {
                    "const": "deliveredOnline",
                    "title": "Online"
                }
                ]
            },
            "title": "How will this program be delivered? (Select all that apply)",
            "minItems": 1,
            "errorMessage": {
                "minItems": "At least one program delivery type must be selected."
            }
            },
            "courseLoadCalculation": {
            "oneOf": [
                {
                "const": "credit",
                "title": "Credit based"
                },
                {
                "const": "hours",
                "title": "Hours based"
                }
            ],
            "title": "Program course load calculation is:"
            },
            "wilProgramEligibility": {
            "enum": [
                "yes",
                "no"
            ],
            "type": "string",
            "title": "Does the WIL meet the program eligibility requirements according to StudentAid BC policy?",
            "format": "yesNo"
            },
            "institutionProgramCode": {
            "type": "string",
            "title": "Institution Program Code",
            "maxLength": 50
            },
            "credentialTypesAviation": {
            "type": "array",
            "items": {
                "oneOf": [
                {
                    "const": "commercialPilotTraining",
                    "title": "Commercial Pilot Training"
                },
                {
                    "const": "instructorsRating",
                    "title": "Instructor's Rating"
                },
                {
                    "const": "endorsements",
                    "title": "Endorsements"
                },
                {
                    "const": "privatePilotTraining",
                    "title": "Private Pilot Training"
                }
                ]
            },
            "title": "Which credential type(s) are included? (Select all that apply)",
            "minItems": 1,
            "errorMessage": {
                "minItems": "At least one credential type must be selected."
            }
            },
            "sameOnlineCreditsEarned": {
            "enum": [
                "yes",
                "no"
            ],
            "type": "string",
            "title": "Will the students earn the same number of credits in the same time period as students in other StudentAid BC eligible programs delivered on site?",
            "format": "yesNo"
            },
            "travelProgramEligibility": {
            "enum": [
                "yes",
                "no"
            ],
            "type": "string",
            "title": "Does the field trip, field placement, or travel meet the program eligibility requirements according to StudentAid BC policy?",
            "format": "yesNo"
            },
            "deliveredOnlineAlsoOnsite": {
            "enum": [
                "yes",
                "no"
            ],
            "type": "string",
            "title": "Will the program also be offered and delivered at 100% course load on site?",
            "format": "yesNo"
            },
            "hasJointDesignatedInstitution": {
            "enum": [
                "yes",
                "no"
            ],
            "type": "string",
            "title": "Are all institutions you partner with for this program designated by StudentAid BC?",
            "format": "yesNo"
            },
            "intlExchangeProgramEligibility": {
            "enum": [
                "yes",
                "no"
            ],
            "type": "string",
            "title": "Does the international exchange meet the program eligibility requirements according to StudentAid BC policy?",
            "format": "yesNo"
            },
            "earnAcademicCreditsOtherInstitution": {
            "enum": [
                "yes",
                "no"
            ],
            "type": "string",
            "title": "Will they earn academic credits that are recognized at another designated institution listed in the BC Transfer Guide or other acceptable articulation agreements from other jurisdictions?",
            "format": "yesNo"
            }
        },
        "errorMessage": {
            "required": {
            "name": "Program name is required.",
            "cipCode": "Classification of Instructional Programs (CIP) is required.",
            "hasTravel": "Please indicate if a field trip, field placement or travel is part of this program.",
            "credentialType": "Credential type is required.",
            "eslEligibility": "Please select the ESL content percentage for this program.",
            "regulatoryBody": "Please select which regulatory body this program belongs to.",
            "completionYears": "Please select the program length.",
            "hasIntlExchange": "Please indicate if the program has an international exchange.",
            "hasWILComponent": "Please indicate if this program has a WIL component.",
            "programIntensity": "Please indicate if students are able to take this on a part time basis.",
            "isAviationProgram": "Please indicate if this program contains aviation.",
            "hasJointInstitution": "Please indicate if the program is offered jointly or in partnership with other institutions.",
            "entranceRequirements": "Please select at least one entrance requirement.",
            "programDeliveryTypes": "Please select how this program will be delivered.",
            "courseLoadCalculation": "Please select the program course load calculation."
            }
        }
    }
    $$ :: jsonb AS validation_schema,
    id AS program_year_id,
    TRUE AS is_active
FROM
    sims.program_years;