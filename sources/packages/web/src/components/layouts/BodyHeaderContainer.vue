<template>
  <div class="mb-5">
    <v-card v-if="props.enableCardView">
      <v-container :fluid="true">
        <slot name="header"></slot>
        <slot></slot>
      </v-container>
    </v-card>
    <div v-else>
      <slot name="header"
        ><body-header
          :title="props.title"
          :sub-title="props.hideSubTitle ? undefined : props.subTitle"
          :title-header-level="props.titleHeaderLevel"
          :header-size="props.headerSize"
          :header-color="props.headerColor"
      /></slot>
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
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
</script>
