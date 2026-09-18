<template>
  <radio-options-group
    v-model="model"
    v-bind="$attrs"
    :items="items"
    :label="label"
  >
    <template v-if="$slots.label" #label>
      <slot name="label"></slot>
    </template>
  </radio-options-group>
</template>

<script setup lang="ts">
import RadioOptionsGroup from "@/components/generic/RadioOptionsGroup.vue";
import type { ComponentItemType } from "@/types";
import { FormYesNoOptions } from "@/types";

// Automatically handles the v-model binding.
const model = defineModel<string | boolean | number>();
defineProps<{ label: string }>();
const items: ComponentItemType[] = [
  { title: "Yes", value: FormYesNoOptions.Yes },
  { title: "No", value: FormYesNoOptions.No },
];

// Inherit attributes is false so $attrs binds directly to the group, not a wrapper div
defineOptions({
  inheritAttrs: false,
});
</script>
