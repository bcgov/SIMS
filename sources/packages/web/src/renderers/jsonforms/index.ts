import type { JsonFormsRendererRegistryEntry } from "@jsonforms/core";
import TextControlRenderer from "./TextControlRenderer.vue";
import YesNoControlRenderer from "./YesNoControlRenderer.vue";
import VerticalLayoutRenderer from "./VerticalLayoutRenderer.vue";
import GroupLayoutRenderer from "./GroupLayoutRenderer.vue";
import FieldOfStudyCodeRenderer from "./FieldOfStudyCodeRenderer.vue";
import CheckboxOptionsGroupRenderer from "./CheckboxOptionsGroupRenderer.vue";
import AviationCredentialsOptionsRenderer from "./AviationCredentialsOptionsRenderer.vue";
import {
  textControlTester,
  yesNoControlTester,
  verticalLayoutTester,
  groupLayoutTester,
  fieldOfStudyCodeTester,
  checkboxOptionsGroupTester,
  aviationCredentialsOptionsTester,
} from "./testers";

/**
 * POC renderer set for the dynamic Program form section.
 * Intentionally does NOT depend on @jsonforms/vue-vuetify - every renderer
 * below wraps this project's own components directly.
 */
export const programDynamicFormRenderers: JsonFormsRendererRegistryEntry[] = [
  { renderer: TextControlRenderer, tester: textControlTester },
  { renderer: YesNoControlRenderer, tester: yesNoControlTester },
  { renderer: VerticalLayoutRenderer, tester: verticalLayoutTester },
  { renderer: GroupLayoutRenderer, tester: groupLayoutTester },
  { renderer: FieldOfStudyCodeRenderer, tester: fieldOfStudyCodeTester },
  {
    renderer: CheckboxOptionsGroupRenderer,
    tester: checkboxOptionsGroupTester,
  },
  {
    renderer: AviationCredentialsOptionsRenderer,
    tester: aviationCredentialsOptionsTester,
  },
];
