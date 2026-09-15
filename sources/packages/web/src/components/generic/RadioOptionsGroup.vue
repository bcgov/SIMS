<template>
  <v-radio-group
    v-model="model"
    v-bind="$attrs"
    hide-details="auto"
    class="my-3"
  >
    <v-label class="text-wrap">{{ label }}</v-label>
    <template v-for="item in items" :key="item[itemValue]">
      <v-radio :label="item[itemTitle]" :value="item[itemValue]"></v-radio>
    </template>
  </v-radio-group>
</template>

<script setup lang="ts">
type ItemType =
  | { title: string; value: string | number }
  | { lookupKey: string; lookupValue: string | number };

// Automatically handles the v-model binding.
const model = defineModel<string | boolean | number>();

withDefaults(
  defineProps<{
    items: ItemType[];
    label: string;
    itemValue?: "value" | "lookupKey";
    itemTitle?: "title" | "lookupValue";
  }>(),
  {
    itemValue: "value",
    itemTitle: "title",
  },
);

// Inherit attributes is false so $attrs binds directly to the group, not a wrapper div
defineOptions({
  inheritAttrs: false,
});
</script>
