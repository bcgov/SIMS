import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

/**
 * POC only: stand-in for a schema that, in a real implementation, would be
 * fetched from the backend per program-year version and stored alongside
 * the submitted data's schema version.
 */
export const programDynamicSchema: JsonSchema = {
  type: "object",
  properties: {
    internalPOCNote: {
      type: "string",
      title: "Additional program note (POC)",
    },
    hasAdditionalRequirement: {
      type: "string",
      format: "yesNo",
      enum: ["yes", "no"],
      title: "Does this program have an additional requirement? (POC)",
    },
    credentialType: {
      type: "string",
      title: "Credential type (POC)",
    },
    cipCode: {
      type: "string",
      title: "CIP code (POC)",
    },
    fieldOfStudyCode: {
      type: "integer",
      title: "Field of study code (POC, calculated)",
    },
  },
  required: ["internalPOCNote"],
};

export const programDynamicUiSchema: UISchemaElement = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Group",
      label: "Dynamic program details (POC) A",
      elements: [
        {
          type: "VerticalLayout",
          elements: [
            { type: "Control", scope: "#/properties/internalPOCNote" },
            {
              type: "Control",
              scope: "#/properties/hasAdditionalRequirement",
            },
          ],
        },
      ],
    },
    {
      type: "Group",
      label: "Dynamic program details (POC) B",
      elements: [
        {
          type: "VerticalLayout",
          elements: [
            { type: "Control", scope: "#/properties/credentialType" },
            { type: "Control", scope: "#/properties/cipCode" },
            { type: "Control", scope: "#/properties/fieldOfStudyCode" },
          ],
        },
      ],
    },
  ],
};
