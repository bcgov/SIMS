<template>
  <div>
    <v-row no-gutters>
      <v-col cols="auto" class="mr-2">
        <dynamic-header
          :title="fullTitleMessage"
          :level="titleHeaderLevel"
          :class="headerClass"
        />
      </v-col>
      <v-col cols="auto" class="mr-2">
        <slot name="status-chip"></slot>
      </v-col>
      <v-col>
        <slot name="actions"></slot>
      </v-col>
    </v-row>
    <v-row no-gutters class="mb-2">
      <v-col>
        <slot name="subtitle">{{ subTitle }}</slot>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import DynamicHeader from "./DynamicHeader.vue";

interface Props {
  title?: string;
  titleHeaderLevel?: number;
  subTitle?: string;
  recordsCount?: number;
  headerSize?: "large" | "medium" | "small" | "x-small";
  headerColor?: "primary" | "secondary" | "secondary-light";
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  titleHeaderLevel: 2,
  subTitle: undefined,
  recordsCount: undefined,
  headerSize: "large",
  headerColor: "primary",
});

const fullTitleMessage = computed(() => {
  if (props.recordsCount) {
    return `${props.title} (${props.recordsCount})`;
  }
  return props.title;
});

const headerClass = computed(() => {
  let sizeClass = "";
  switch (props.headerSize) {
    case "large":
      sizeClass = "category-header-large";
      break;
    case "medium":
      sizeClass = "category-header-medium";
      break;
    case "small":
      sizeClass = "category-header-medium-small";
      break;
    case "x-small":
      sizeClass = "category-header-small";
      break;
  }
  let colorClass = "";
  switch (props.headerColor) {
    case "primary":
      colorClass = "primary-color";
      break;
    case "secondary":
      colorClass = "secondary-color";
      break;
    case "secondary-light":
      colorClass = "secondary-color-light";
      break;
  }
  return [sizeClass, colorClass];
});
</script>
