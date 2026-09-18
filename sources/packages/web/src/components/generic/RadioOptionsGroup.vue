<template>
  <v-radio-group
    color="primary"
    v-model="model"
    v-bind="$attrs"
    hide-details="auto"
    class="my-3"
  >
    <v-label class="text-wrap"
      ><slot name="label">{{ label }}</slot></v-label
    >
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
    label?: string;
    itemValue?: "value" | "lookupKey";
    itemTitle?: "title" | "lookupValue";
  }>(),
  {
    label: undefined,
    itemValue: "value",
    itemTitle: "title",
  },
);

// Inherit attributes is false so $attrs binds directly to the group, not a wrapper div
defineOptions({
  inheritAttrs: false,
});
</script>
