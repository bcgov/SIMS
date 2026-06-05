<template>
  <div class="mb-3">
    <v-card v-if="props.enableCardView">
      <v-container :fluid="true">
        <slot name="header"></slot>
        <slot></slot>
      </v-container>
    </v-card>
    <div v-else>
      <slot name="header"><body-header v-bind="headerProps" /></slot>
      <slot></slot>
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
}

const props = withDefaults(defineProps<Props>(), {
  enableCardView: false,
  title: "",
  subTitle: "",
  titleHeaderLevel: 2,
  hideSubTitle: false,
  headerSize: "large",
  headerColor: "primary",
});

const headerProps = computed(() => {
  return {
    title: props.title,
    subTitle: props.hideSubTitle ? undefined : props.subTitle,
    titleHeaderLevel: props.titleHeaderLevel,
    headerSize: props.headerSize,
    headerColor: props.headerColor,
  };
});
</script>
