<template>
  <div class="my-3">
    <v-label class="text-wrap">{{ label }}</v-label>
    <template v-for="item in items" :key="item[itemValue]">
      <v-checkbox
        class="ml-3"
        density="compact"
        :label="item[itemTitle]"
        :value="item[itemValue]"
        v-model="model"
        v-bind="$attrs"
        hide-details
      ></v-checkbox>
    </template>
    <v-input :model-value="model" hide-details="auto" :rules="rules"> </v-input>
  </div>
</template>

<script setup lang="ts">
type ModelType = string[] | number[];
type ItemType =
  | { title: string; value: string | number }
  | { lookupKey: string; lookupValue: string | number };

// Automatically handles the v-model binding.
const model = defineModel<ModelType>({ default: () => [] });

withDefaults(
  defineProps<{
    items: ItemType[];
    label: string;
    itemValue?: "value" | "lookupKey";
    itemTitle?: "title" | "lookupValue";
    rules?: ((v: ModelType) => boolean | string)[];
  }>(),
  {
    itemValue: "value",
    itemTitle: "title",
    rules: undefined,
  },
);

// Inherit attributes is false so $attrs binds directly to the group, not a wrapper div
defineOptions({
  inheritAttrs: false,
});
</script>
