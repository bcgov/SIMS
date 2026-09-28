<script setup lang="ts">
import { computed } from "vue";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
import type { ControlElement, JsonSchema } from "@jsonforms/core";
import CheckboxOptionsGroup from "@/components/generic/CheckboxOptionsGroup.vue";
import { PROGRAM_ENTRANCE_REQUIREMENT_NONE } from "@/constants/program-constants";

const props = defineProps(rendererProps<ControlElement>());
const { control, handleChange } = useJsonFormsControl(props);

const items = computed(() =>
  Object.entries(control.value.schema.properties ?? {}).map(
    ([key, schema]) => ({
      title: (schema as JsonSchema).title ?? key,
      value: key,
    }),
  ),
);

const selected = computed(() => {
  const data = (control.value.data ?? {}) as Record<string, boolean>;
  return items.value.map((item) => item.value).filter((key) => data[key]);
});

const onUpdate = (newValue: Array<string | number>) => {
  const noneWasSelected = selected.value.includes(
    PROGRAM_ENTRANCE_REQUIREMENT_NONE,
  );
  let nextValue = newValue;
  if (noneWasSelected) {
    // Something else was just toggled alongside (or "none" was just
    // unchecked) - "none" no longer applies either way.
    nextValue = newValue.filter(
      (value) => value !== PROGRAM_ENTRANCE_REQUIREMENT_NONE,
    );
  } else if (newValue.includes(PROGRAM_ENTRANCE_REQUIREMENT_NONE)) {
    // "none" was just checked alongside possibly other selections -
    // collapse down to "none" alone.
    nextValue = [PROGRAM_ENTRANCE_REQUIREMENT_NONE];
  }
  // Every key is always present, the unchecked ones saved as false.
  const data = Object.fromEntries(
    items.value.map(({ value }) => [value, nextValue.includes(value)]),
  );
  handleChange(control.value.path, data);
};
</script>

<template>
  <checkbox-options-group
    v-if="control.visible"
    color="primary"
    :model-value="selected"
    @update:model-value="onUpdate"
    :items="items"
    :label="control.label"
    :readonly="control.readonly || !control.enabled"
    :error-messages="control.errors ? [control.errors] : []"
  ></checkbox-options-group>
</template>
