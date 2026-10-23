<script setup lang="ts">
import { computed } from "vue";
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsLayout,
} from "@jsonforms/vue";
import type { GroupLayout } from "@jsonforms/core";

const props = defineProps(rendererProps<GroupLayout>());
const { layout } = useJsonFormsLayout(props);

const groupTitle = computed(() => {
  const label = (layout.value.uischema as GroupLayout).label;
  return typeof label === "string" ? label : undefined;
});
// Static, developer-authored rich subtitle (e.g. a link) - never user
// input, so v-html is safe here. Needs its own #header override since
// body-header-container's default header doesn't expose a subtitle slot.
const subtitleHtml = computed(
  () => layout.value.uischema.options?.subtitleHtml as string | undefined,
);
</script>

<template>
  <body-header-container
    v-if="layout.visible"
    :title="groupTitle"
    header-size="medium"
  >
    <template v-if="subtitleHtml" #header>
      <body-header :title="groupTitle" header-size="medium">
        <template #subtitle>
          <span v-html="subtitleHtml"></span>
        </template>
      </body-header>
    </template>
    <content-group>
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
    </content-group>
  </body-header-container>
</template>
