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
import BannerRenderer from "./BannerRenderer.vue";
import BooleanCheckboxRenderer from "./BooleanCheckboxRenderer.vue";
import EntranceRequirementsRenderer from "./EntranceRequirementsRenderer.vue";
import {
  textControlTester,
  yesNoControlTester,
  verticalLayoutTester,
  groupLayoutTester,
  fieldOfStudyCodeTester,
  checkboxOptionsGroupTester,
  oneOfRadioTester,
  oneOfSelectTester,
  bannerTester,
  booleanCheckboxTester,
  entranceRequirementsTester,
} from "./testers";

/**
 * Renderer set for the Program form, built on @jsonforms/core + @jsonforms/vue
 * directly - intentionally does NOT depend on @jsonforms/vue-vuetify, so
 * every renderer below wraps this project's own components directly and
 * targets its Vuetify version without a third-party renderer's version lag.
 *
 * Each component is wrapped in markRaw(): @jsonforms/vue stores this array
 * inside its internal reactive JsonForms state, and without markRaw, Vue's
 * reactivity system would deep-proxy the component definition objects
 * themselves - triggering "Vue received a Component that was made a
 * reactive object" and adding needless reactivity overhead, since a
 * component definition is static and never needs to be observed.
 */
export const programFormRenderers: JsonFormsRendererRegistryEntry[] = [
  { renderer: markRaw(TextControlRenderer), tester: textControlTester },
  { renderer: markRaw(YesNoControlRenderer), tester: yesNoControlTester },
  {
    renderer: markRaw(VerticalLayoutRenderer),
    tester: verticalLayoutTester,
  },
  { renderer: markRaw(GroupLayoutRenderer), tester: groupLayoutTester },
  {
    renderer: markRaw(FieldOfStudyCodeRenderer),
    tester: fieldOfStudyCodeTester,
  },
  {
    renderer: markRaw(CheckboxOptionsGroupRenderer),
    tester: checkboxOptionsGroupTester,
  },
  { renderer: markRaw(OneOfRadioOptionsRenderer), tester: oneOfRadioTester },
  { renderer: markRaw(OneOfSelectRenderer), tester: oneOfSelectTester },
  { renderer: markRaw(BannerRenderer), tester: bannerTester },
  {
    renderer: markRaw(BooleanCheckboxRenderer),
    tester: booleanCheckboxTester,
  },
  {
    renderer: markRaw(EntranceRequirementsRenderer),
    tester: entranceRequirementsTester,
  },
];
