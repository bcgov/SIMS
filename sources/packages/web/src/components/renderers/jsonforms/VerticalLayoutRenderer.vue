<script setup lang="ts">
import { DispatchRenderer, rendererProps, useJsonFormsLayout } from "@jsonforms/vue";
import type { Layout } from "@jsonforms/core";

const props = defineProps(rendererProps<Layout>());
const { layout } = useJsonFormsLayout(props);
</script>

<template>
  <div v-if="layout.visible">
    <dispatch-renderer
      v-for="(element, index) in layout.uischema.elements"
      :key="`${layout.path}-${index}`"
      :schema="layout.schema"
      :uischema="element"
      :path="layout.path"
      :enabled="layout.enabled"
      :renderers="layout.renderers"
      :cells="layout.cells"
    />
  </div>
</template>
