<script setup lang="ts">
import { computed } from "vue";
import { rendererProps, useJsonFormsMultiEnumControl } from "@jsonforms/vue";
import type { ControlElement } from "@jsonforms/core";
import CheckboxOptionsGroup from "@/components/generic/CheckboxOptionsGroup.vue";

const props = defineProps(rendererProps<ControlElement>());
const { control, addItem, removeItem } = useJsonFormsMultiEnumControl(props);

// CheckboxOptionsGroup expects { title, value } items; JSONForms derives
// { label, value } EnumOptions from the schema's items.enum (or items.oneOf).
const items = computed(() =>
  control.value.options.map((option) => ({
    title: option.label,
    value: option.value,
  })),
);

// CheckboxOptionsGroup's v-model manages the whole selected array natively
// (each checkbox toggling adds/removes just its own value), so the update
// is translated into the addItem/removeItem dispatch pair JSONForms expects
// for multi-enum controls.
const onUpdate = (newValue: (string | number)[]) => {
  const oldValue = (control.value.data ?? []) as (string | number)[];
  newValue
    .filter((value) => !oldValue.includes(value))
    .forEach((value) => addItem(control.value.path, value));
  oldValue
    .filter((value) => !newValue.includes(value))
    .forEach((value) => removeItem?.(control.value.path, value));
};
</script>

<template>
  <checkbox-options-group
    v-if="control.visible"
    :model-value="control.data"
    @update:model-value="onUpdate"
    :items="items"
    :label="control.label"
    :readonly="control.readonly || !control.enabled"
    color="primary"
  ></checkbox-options-group>
</template>
