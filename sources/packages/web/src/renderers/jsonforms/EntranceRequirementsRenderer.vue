<script setup lang="ts">
import { computed } from "vue";
import { rendererProps, useJsonFormsMultiEnumControl } from "@jsonforms/vue";
import type { ControlElement } from "@jsonforms/core";
import CheckboxOptionsGroup from "@/components/generic/CheckboxOptionsGroup.vue";
import { PROGRAM_ENTRANCE_REQUIREMENT_NONE } from "@/constants/program-constants";

const props = defineProps(rendererProps<ControlElement>());
const { control, addItem, removeItem } = useJsonFormsMultiEnumControl(props);

const items = computed(() =>
  control.value.options.map((option) => ({
    title: option.label,
    value: option.value,
  })),
);

// "None of the above" is mutually exclusive with every other entrance
// requirement: picking it clears any other selection, and picking any
// other requirement while it's selected clears it - mirrors the original
// updateEntranceRequirements() behaviour exactly.
const onUpdate = (newValue: string[]) => {
  const oldValue = (control.value.data ?? []) as string[];
  const noneWasSelected = oldValue.includes(PROGRAM_ENTRANCE_REQUIREMENT_NONE);
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
  nextValue
    .filter((value) => !oldValue.includes(value))
    .forEach((value) => addItem(control.value.path, value));
  oldValue
    .filter((value) => !nextValue.includes(value))
    .forEach((value) => removeItem?.(control.value.path, value));
};
</script>

<template>
  <checkbox-options-group
    v-if="control.visible"
    color="primary"
    :model-value="control.data"
    @update:model-value="onUpdate"
    :items="items"
    :label="control.label"
    :readonly="control.readonly || !control.enabled"
    :error-messages="control.errors ? [control.errors] : []"
  ></checkbox-options-group>
</template>
