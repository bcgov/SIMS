<script setup lang="ts">
import { computed } from "vue";
import { rendererProps, useJsonFormsLabel } from "@jsonforms/vue";
import type { LabelElement } from "@jsonforms/core";
import { BannerTypes } from "@/types";

const props = defineProps(rendererProps<LabelElement>());
const { label } = useJsonFormsLabel(props);

// A Label element's standard "text" isn't used here - the banner's
// type/header/content come from UI Schema "options" instead, so the same rule
// (visibility)/tester mechanism used for Controls can drive a banner too.
const type = computed(
  () =>
    (label.value.uischema.options?.type as BannerTypes | undefined) ??
    BannerTypes.Info,
);
const header = computed(
  () => label.value.uischema.options?.header as string | undefined,
);
// Static, developer-authored rich content (e.g. the partner-institution
// review banner's mailto link) - never user input, so v-html is safe here.
const content = computed(
  () => label.value.uischema.options?.content as string | undefined,
);
</script>

<template>
  <banner
    v-if="label.visible"
    :type="type"
    :header="header"
    density="compact"
    class="my-3"
  >
    <template v-if="content" #content>
      <span v-html="content"></span>
    </template>
  </banner>
</template>
