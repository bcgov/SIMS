import { markRaw } from "vue";
import type { JsonFormsRendererRegistryEntry } from "@jsonforms/core";
import TextControlRenderer from "./TextControlRenderer.vue";
import YesNoControlRenderer from "./YesNoControlRenderer.vue";
import VerticalLayoutRenderer from "./VerticalLayoutRenderer.vue";
import GroupLayoutRenderer from "./GroupLayoutRenderer.vue";
import FieldOfStudyCodeRenderer from "./FieldOfStudyCodeRenderer.vue";
import CheckboxOptionsGroupRenderer from "./CheckboxOptionsGroupRenderer.vue";
import OneOfRadioOptionsRenderer from "./OneOfRadioOptionsRenderer.vue";
import OneOfSelectRenderer from "./OneOfSelectRenderer.vue";
import LabelRenderer from "./LabelRenderer.vue";
import BannerRenderer from "./BannerRenderer.vue";
import BooleanCheckboxRenderer from "./BooleanCheckboxRenderer.vue";
import {
  textControlTester,
  yesNoControlTester,
  verticalLayoutTester,
  groupLayoutTester,
  fieldOfStudyCodeTester,
  checkboxOptionsGroupTester,
  oneOfRadioTester,
  oneOfSelectTester,
  labelTester,
  bannerTester,
  booleanCheckboxTester,
} from "./testers";

/**
 * Renderer set to be shared across the project.
 * Built on @jsonforms/core + @jsonforms/vue directly - intentionally does
 * NOT depend on @jsonforms/vue-vuetify, so every renderer below wraps this
 * project's own components directly and targets its Vuetify version without
 * a third-party renderer's version lag.
 */
export const COMMON_FORM_RENDERERS: JsonFormsRendererRegistryEntry[] = [
  { renderer: markRaw(TextControlRenderer), tester: textControlTester },
  { renderer: markRaw(YesNoControlRenderer), tester: yesNoControlTester },
  {
    renderer: markRaw(VerticalLayoutRenderer),
    tester: verticalLayoutTester,
  },
  { renderer: markRaw(GroupLayoutRenderer), tester: groupLayoutTester },

  {
    renderer: markRaw(CheckboxOptionsGroupRenderer),
    tester: checkboxOptionsGroupTester,
  },
  { renderer: markRaw(OneOfRadioOptionsRenderer), tester: oneOfRadioTester },
  { renderer: markRaw(OneOfSelectRenderer), tester: oneOfSelectTester },
  { renderer: markRaw(LabelRenderer), tester: labelTester },
  { renderer: markRaw(BannerRenderer), tester: bannerTester },
  {
    renderer: markRaw(BooleanCheckboxRenderer),
    tester: booleanCheckboxTester,
  },
];

/**
 * Education program specific renderers.
 */
export const PROGRAM_FORM_RENDERERS: JsonFormsRendererRegistryEntry[] = [
  ...COMMON_FORM_RENDERERS,
  {
    renderer: markRaw(FieldOfStudyCodeRenderer),
    tester: fieldOfStudyCodeTester,
  },
];
