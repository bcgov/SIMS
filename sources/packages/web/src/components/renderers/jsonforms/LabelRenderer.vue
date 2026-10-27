<template>
  <p v-if="label.visible && label.text">
    {{ label.text }}
  </p>
</template>
<script setup lang="ts">
import { rendererProps, useJsonFormsLabel } from "@jsonforms/vue";
import type { LabelElement } from "@jsonforms/core";

const props = defineProps(rendererProps<LabelElement>());
const { label } = useJsonFormsLabel(props);
</script>
