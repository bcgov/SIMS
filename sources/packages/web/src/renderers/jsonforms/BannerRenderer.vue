<script setup lang="ts">
import { computed } from "vue";
import { rendererProps, useJsonFormsLabel } from "@jsonforms/vue";
import type { LabelElement } from "@jsonforms/core";
import ProgramEligibilityBanner from "@/components/institutions/banners/ProgramEligibilityBanner.vue";

const props = defineProps(rendererProps<LabelElement>());
const { label } = useJsonFormsLabel(props);

// A Label element's standard "text" isn't used here - the banner's own
// header/summary come from UI Schema "options" instead, so the same rule
// (visibility)/tester mechanism used for Controls can drive a banner too.
const header = computed(
  () => label.value.uischema.options?.header as string | undefined,
);
const summary = computed(
  () => label.value.uischema.options?.summary as string | undefined,
);
// Static, developer-authored rich content (e.g. the partner-institution
// review banner's mailto link) - never user input, so v-html is safe here.
const contentHtml = computed(
  () => label.value.uischema.options?.contentHtml as string | undefined,
);
// Plain informational text (e.g. the Declaration section's intro line),
// styled like the rest of this project's section text rather than as a
// warning banner.
const plainText = computed(
  () => label.value.uischema.options?.plainText as string | undefined,
);
</script>

<template>
  <p
    v-if="label.visible && plainText"
    class="category-header-medium-small primary-color"
  >
    {{ plainText }}
  </p>
  <program-eligibility-banner
    v-else-if="label.visible"
    :header="header"
    :summary="summary"
  >
    <template v-if="contentHtml" #content>
      <span v-html="contentHtml"></span>
    </template>
  </program-eligibility-banner>
</template>
