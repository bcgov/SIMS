<template>
  <div class="mb-3">
    <v-card v-if="props.enableCardView">
      <v-container :fluid="true">
        <slot name="header"><body-header v-bind="headerProps" /></slot>
        <div class="mt-2">
          <slot></slot>
        </div>
      </v-container>
    </v-card>
    <div v-else class="mb-3">
      <slot name="header"><body-header v-bind="headerProps" /></slot>
      <div class="mt-2">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  enableCardView?: boolean;
  title?: string;
  subTitle?: string;
  titleHeaderLevel?: number;
  hideSubTitle?: boolean;
  headerSize?: "large" | "medium" | "small" | "x-small";
  headerColor?: "primary" | "secondary" | "secondary-light";
  recordsCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  enableCardView: false,
  title: "",
  subTitle: "",
  titleHeaderLevel: 2,
  hideSubTitle: false,
  headerSize: "large",
  headerColor: "primary",
  recordsCount: undefined,
});

const headerProps = computed(() => {
  return {
    title: props.title,
    subTitle: props.hideSubTitle ? undefined : props.subTitle,
    titleHeaderLevel: props.titleHeaderLevel,
    headerSize: props.headerSize,
    headerColor: props.headerColor,
    recordsCount: props.recordsCount,
  };
});
</script>
