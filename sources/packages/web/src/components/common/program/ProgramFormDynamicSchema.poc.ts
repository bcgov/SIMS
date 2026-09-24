import { RuleEffect } from "@jsonforms/core";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

/**
 * POC only: stand-in for a schema that, in a real implementation, would be
 * fetched from the backend per program-year version and stored alongside
 * the submitted data's schema version.
 */
// Stand-in for the rows a real implementation would read from the aviation
// credential lookup table. Declared once and reused below (for "properties"
// and for the "at least one selected" rule) so the two can't drift apart.
const credentialTypesAviationProperties = {
  endorsements: { type: "boolean", title: "Endorsements" },
  noneOfTheAbove: { type: "boolean", title: "None of the above" },
  instructorsRating: { type: "boolean", title: "Instructor's rating" },
  privatePilotTraining: { type: "boolean", title: "Private pilot training" },
  commercialPilotTraining: {
    type: "boolean",
    title: "Commercial pilot training",
  },
};
// Cast rather than annotated as JsonSchema directly: "errorMessage" (from
// the ajv-errors plugin - see ./../renderers/jsonforms/ajv.ts) is not part
// of the standard JsonSchema7 type, so a direct `: JsonSchema` annotation
// would fail TypeScript's excess-property check on this object literal.
export const programDynamicSchema = {
  type: "object",
  properties: {
    isAviationProgram: {
      type: "string",
      format: "yesNo",
      enum: ["yes", "no"],
      title: "Does this program contain aviation?",
    },
    credentialTypesAviation: {
      type: "object",
      format: "aviationCredentials",
      properties: credentialTypesAviationProperties,
      additionalProperties: false,
      // "at least one option is true": JSON Schema has no direct keyword
      // for this, so it's expressed as "at least one of these N branches
      // validates", where each branch demands one specific key be true.
      anyOf: Object.keys(credentialTypesAviationProperties).map((key) => ({
        required: [key],
        properties: { [key]: { const: true } },
      })),
      errorMessage: {
        anyOf: "Select at least one credential type.",
      },
    },
    minHoursWeekAvi: {
      type: "string",
      format: "yesNo",
      enum: ["yes", "no"],
      title:
        "Does this program include a minimum of 15 instructional hours per week?",
    },
  },
  required: ["isAviationProgram"],
  // ajv-errors keyword: overrides AJV's generic "must have required
  // property 'x'" text with a message specific to this field/schema.
  errorMessage: {
    required: {
      isAviationProgram:
        "Please indicate whether this program includes aviation.",
    },
  },
  if: {
    required: ["isAviationProgram"],
    properties: { isAviationProgram: { const: "yes" } },
  },
  then: {
    required: ["credentialTypesAviation", "minHoursWeekAvi"],
    errorMessage: {
      required: {
        credentialTypesAviation:
          "Select at least one credential type, since this program includes aviation.",
        minHoursWeekAvi:
          "Please indicate whether this program includes a minimum of 15 instructional hours per week.",
      },
    },
  },
} as JsonSchema;

export const programDynamicUiSchema: UISchemaElement = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Group",
      label: "Aviation",
      elements: [
        {
          type: "VerticalLayout",
          elements: [
            {
              label: "Does this program contain aviation?",
              type: "Control",
              scope: "#/properties/isAviationProgram",
            },
            {
              label:
                "Which credential type(s) are included? (Select all that apply)",
              type: "Control",
              scope: "#/properties/credentialTypesAviation",
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  scope: "#/properties/isAviationProgram",
                  schema: { const: "yes" },
                },
              },
            },
            {
              label:
                "Does this program include a minimum of 15 instructional hours per week?",
              type: "Control",
              scope: "#/properties/minHoursWeekAvi",
              rule: {
                effect: RuleEffect.SHOW,
                condition: {
                  scope: "#/properties/isAviationProgram",
                  schema: { const: "yes" },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
