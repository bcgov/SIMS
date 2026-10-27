import {
  and,
  formatIs,
  isBooleanControl,
  isStringControl,
  optionIs,
  rankWith,
  uiTypeIs,
} from "@jsonforms/core";

/**
 * Renderer priority tiers - the highest rank returned by a tester wins.
 * Testers in the same tier must never match the same element, otherwise
 * JSON Forms falls back to the registration order to break the tie.
 */
const RANK = {
  /**
   * Generic fallback by UI element or schema type (text, layouts, labels).
   */
  Default: 1,
  /**
   * Inferred from the JSON Schema (type/format).
   */
  Schema: 2,
  /**
   * Explicitly requested via the UI Schema "options.component", which must
   * always win over anything inferred from the JSON Schema.
   */
  UiOption: 3,
} as const;

/**
 * Matches any string control, so it falls back to a plain text field when no
 * more specific renderer (e.g. "yesNo" format) applies.
 */
export const textControlTester = rankWith(RANK.Default, isStringControl);

/**
 * Matches the root/nested VerticalLayout UI schema elements.
 */
export const verticalLayoutTester = rankWith(
  RANK.Default,
  uiTypeIs("VerticalLayout"),
);

/**
 * Matches Group UI schema elements, rendered as a titled
 * body-header-container/content-group section.
 */
export const groupLayoutTester = rankWith(RANK.Default, uiTypeIs("Group"));

/**
 * Matches any Label element, rendering its standard "text" as plain text.
 */
export const labelTester = rankWith(RANK.Default, uiTypeIs("Label"));

/**
 * Matches controls whose schema is flagged with the custom "yesNo" format,
 * routing them to the project's existing RadioOptionsYesNo component.
 */
export const yesNoControlTester = rankWith(
  RANK.Schema,
  and(uiTypeIs("Control"), formatIs("yesNo")),
);

/**
 * Matches plain boolean controls (e.g. the declaration checkbox), routing
 * them to a simple required-checkbox renderer rather than a yes/no radio.
 */
export const booleanCheckboxTester = rankWith(RANK.Schema, isBooleanControl);

/**
 * Matches array controls backed by an enum/oneOf list of options, routing
 * them to the project's existing CheckboxOptionsGroup component.
 */
export const checkboxOptionsGroupTester = rankWith(
  RANK.UiOption,
  and(uiTypeIs("Control"), optionIs("component", "checkboxOptionsGroup")),
);

/**
 * Matches a Control explicitly flagged, via UI Schema options, to render as
 * a single-select radio group (rather than the default text/select
 * renderer a "oneOf" schema would otherwise fall to).
 */
export const oneOfRadioTester = rankWith(
  RANK.UiOption,
  and(uiTypeIs("Control"), optionIs("component", "radio")),
);

/**
 * Matches a Control explicitly flagged, via UI Schema options, to render as
 * a dropdown select - typically a lookup-backed "enum" field.
 */
export const oneOfSelectTester = rankWith(
  RANK.UiOption,
  and(uiTypeIs("Control"), optionIs("component", "select")),
);

/**
 * Matches Label elements explicitly flagged, via UI Schema options, to render
 * as a banner (type/header/content supplied via UI Schema options).
 */
export const bannerTester = rankWith(
  RANK.UiOption,
  and(uiTypeIs("Label"), optionIs("component", "banner")),
);

/**
 * Matches a Control explicitly flagged, via UI Schema options, to render as
 * the read-only field of study code, calculated from sibling fields rather
 * than user-entered.
 */
export const fieldOfStudyCodeTester = rankWith(
  RANK.UiOption,
  and(uiTypeIs("Control"), optionIs("component", "fieldOfStudyCode")),
);

/**
 * Matches a Control explicitly flagged, via UI Schema options, to render as
 * the entrance requirements checkbox group, which has its own
 * mutual-exclusivity behavior ("none of the above" clears every other
 * selection, and vice versa) beyond what a plain checkbox group supports.
 */
export const entranceRequirementsTester = rankWith(
  RANK.UiOption,
  and(uiTypeIs("Control"), optionIs("component", "entranceRequirements")),
);
