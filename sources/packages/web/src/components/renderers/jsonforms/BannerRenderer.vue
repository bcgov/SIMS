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
<script setup lang="ts">
import { computed } from "vue";
import { rendererProps, useJsonFormsLabel } from "@jsonforms/vue";
import type { LabelElement } from "@jsonforms/core";
import { BannerTypes } from "@/types";

const props = defineProps(rendererProps<LabelElement>());
const { label } = useJsonFormsLabel(props);

const type = computed(
  () =>
    (label.value.uischema.options?.type as BannerTypes | undefined) ??
    BannerTypes.Info,
);
const header = computed(
  () => label.value.uischema.options?.header as string | undefined,
);

const content = computed(
  () => label.value.uischema.options?.content as string | undefined,
);
</script>
