import {
  and,
  rankWith,
  schemaMatches,
  scopeEndsWith,
  uiTypeIs,
} from "@jsonforms/core";

/**
 * Matches any string control that does not have a more specific format
 * (e.g. "yesNo"), so it falls back to a plain text field.
 */
export const textControlTester = rankWith(
  1,
  and(
    uiTypeIs("Control"),
    schemaMatches((schema) => schema.type === "string" && !schema.format),
  ),
);

/**
 * Matches controls whose schema is flagged with the custom "yesNo" format,
 * routing them to the project's existing RadioOptionsYesNo component.
 */
export const yesNoControlTester = rankWith(
  10,
  and(
    uiTypeIs("Control"),
    schemaMatches((schema) => schema.format === "yesNo"),
  ),
);

/**
 * Matches the root/nested VerticalLayout UI schema elements.
 */
export const verticalLayoutTester = rankWith(1, uiTypeIs("VerticalLayout"));

/**
 * Matches Group UI schema elements, rendered as a titled
 * body-header-container/content-group section.
 */
export const groupLayoutTester = rankWith(1, uiTypeIs("Group"));

/**
 * Matches the specific "fieldOfStudyCode" field, which is a read-only value
 * calculated from sibling fields rather than user-entered.
 */
export const fieldOfStudyCodeTester = rankWith(
  20,
  and(uiTypeIs("Control"), scopeEndsWith("fieldOfStudyCode")),
);

/**
 * Matches array controls backed by an enum/oneOf list of options, routing
 * them to the project's existing CheckboxOptionsGroup component.
 */
export const checkboxOptionsGroupTester = rankWith(
  10,
  and(
    uiTypeIs("Control"),
    schemaMatches((schema) => {
      if (schema.type !== "array" || !schema.items) {
        return false;
      }
      const itemsSchema = schema.items as { enum?: unknown; oneOf?: unknown };
      return !!itemsSchema.enum || !!itemsSchema.oneOf;
    }),
  ),
);

export const aviationCredentialsOptionsTester = rankWith(
  10,
  and(
    uiTypeIs("Control"),
    schemaMatches((schema) => schema.format === "aviationCredentials"),
  ),
);
