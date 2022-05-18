<template>
  <v-container :fluid="fullWidth">
    <header class="mb-4">
      <slot name="header"></slot>
    </header>
    <slot name="alerts"></slot>
    <template v-if="layoutTemplate === LayoutTemplates.CenteredCard">
      <v-row justify="center">
        <v-card class="p-4 w-100" :class="widthClass">
          <slot></slot>
        </v-card>
      </v-row>
    </template>
    <template v-else-if="layoutTemplate === LayoutTemplates.Centered">
      <v-row justify="center">
        <div class="w-100" :class="widthClass">
          <slot></slot>
        </div>
      </v-row>
    </template>
  </v-container>
</template>

<script lang="ts">
import { computed } from "vue";

enum LayoutTemplates {
  Centered = "Centered",
  CenteredCard = "CenteredCard",
}

export default {
  props: {
    layoutTemplate: {
      type: String,
      required: false,
      default: LayoutTemplates.CenteredCard,
      validator: (val: string) => val in LayoutTemplates,
    },
    fullWidth: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props: any) {
    const widthClass = computed(() => {
      return props.fullWidth ? "" : "full-page-container-size";
    });
    return { LayoutTemplates, widthClass };
  },
};
</script>
