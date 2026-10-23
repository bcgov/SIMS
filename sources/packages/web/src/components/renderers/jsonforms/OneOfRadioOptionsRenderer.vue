<script setup lang="ts">
import { computed } from "vue";
import { rendererProps, useJsonFormsOneOfEnumControl } from "@jsonforms/vue";
import type { ControlElement } from "@jsonforms/core";
import RadioOptionsGroup from "@/components/generic/RadioOptionsGroup.vue";

const props = defineProps(rendererProps<ControlElement>());
const { control, handleChange } = useJsonFormsOneOfEnumControl(props);

// EnumOption { label, value } (derived by JSONForms from the schema's
// oneOf) -> RadioOptionsGroup's { title, value } items.
const items = computed(() =>
  control.value.options.map((option) => ({
    title: option.label,
    value: option.value,
  })),
);

const onUpdate = (value: string) => handleChange(control.value.path, value);

// Optional tooltip text next to the label, set via the UI Schema's
// "options.tooltip" - matches the tooltip-icon usage already elsewhere in
// this project's hand-written radio-options-group fields.
const tooltip = computed(
  () => control.value.uischema.options?.tooltip as string | undefined,
);
</script>

<template>
  <radio-options-group
    v-if="control.visible"
    :model-value="control.data"
    @update:model-value="onUpdate"
    :items="items"
    :label="control.label"
    :readonly="control.readonly || !control.enabled"
    :error-messages="control.errors ? [control.errors] : []"
  >
    <template v-if="tooltip" #label>
      <span>{{ control.label }}</span
      ><tooltip-icon :max-width="670">{{ tooltip }}</tooltip-icon>
    </template>
  </radio-options-group>
</template>
