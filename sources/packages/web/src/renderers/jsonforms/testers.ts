import {
  and,
  optionIs,
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
  and(uiTypeIs("Control"), optionIs("component", "checkboxOptionsGroup")),
);

/**
 * Matches a Control explicitly flagged, via UI Schema options, to render as
 * a single-select radio group (rather than the default text/select
 * renderer a "oneOf" schema would otherwise fall to).
 */
export const oneOfRadioTester = rankWith(
  10,
  and(uiTypeIs("Control"), optionIs("component", "radio")),
);

/**
 * Matches a Control explicitly flagged, via UI Schema options, to render as
 * a dropdown select - typically a lookup-backed "enum" field.
 */
export const oneOfSelectTester = rankWith(
  10,
  and(uiTypeIs("Control"), optionIs("component", "select")),
);

/**
 * Matches Label elements, used here to render a conditional info banner
 * (header/summary supplied via UI Schema options) rather than plain text.
 */
export const bannerTester = rankWith(10, uiTypeIs("Label"));

/**
 * Matches plain boolean controls (e.g. the declaration checkbox), routing
 * them to a simple required-checkbox renderer rather than a yes/no radio.
 */
export const booleanCheckboxTester = rankWith(
  10,
  and(
    uiTypeIs("Control"),
    schemaMatches((schema) => schema.type === "boolean"),
  ),
);

/**
 * Matches the specific "entranceRequirements" field, which has its own
 * mutual-exclusivity behaviour ("none of the above" clears every other
 * selection, and vice versa) beyond what a plain checkbox group supports.
 */
export const entranceRequirementsTester = rankWith(
  20,
  and(uiTypeIs("Control"), scopeEndsWith("entranceRequirements")),
);
