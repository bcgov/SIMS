<template>
  <div class="my-3">
    <v-label class="text-wrap">{{ label }}</v-label>
    <template v-for="item in items" :key="item.value">
      <v-checkbox
        class="ml-3"
        density="compact"
        :label="item.title"
        :value="item.value"
        v-model="model"
        v-bind="$attrs"
        hide-details
      ></v-checkbox>
    </template>
    <v-input :model-value="model" hide-details="auto" :rules="rules"> </v-input>
  </div>
</template>

<script setup lang="ts">
import type { ComponentItemType } from "@/types";
type ModelType = string[] | boolean[] | number[];

// Automatically handles the v-model binding.
const model = defineModel<ModelType>();

defineProps<{
  items: ComponentItemType[];
  label: string;
  rules?: ((v: ModelType) => boolean | string)[];
}>();

// Inherit attributes is false so $attrs binds directly to the group, not a wrapper div
defineOptions({
  inheritAttrs: false,
});
</script>
