<template>
  <v-radio-group
    v-model="model"
    v-bind="$attrs"
    hide-details="auto"
    class="my-3"
  >
    <v-label class="text-wrap">{{ label }}</v-label>
    <template v-for="item in items" :key="item.value">
      <v-radio :label="item.title" :value="item.value"></v-radio>
    </template>
  </v-radio-group>
</template>

<script setup lang="ts">
import type { ComponentItemType } from "@/types";

// Automatically handles the v-model binding.
const model = defineModel<string | boolean | number>();
defineProps<{ items: ComponentItemType[]; label: string }>();

// Inherit attributes is false so $attrs binds directly to the group, not a wrapper div
defineOptions({
  inheritAttrs: false,
});
</script>
