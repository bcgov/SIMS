<template>
  <v-container>
    <header class="mb-4">
      <slot name="header"></slot>
    </header>
    <template v-if="layoutTemplate === LayoutTemplates.CenteredCard">
      <v-row justify="center">
        <v-card class="p-4 w-100 full-page-container-size">
          <slot></slot>
        </v-card>
      </v-row>
    </template>
    <template v-else-if="layoutTemplate === LayoutTemplates.Centered">
      <v-row justify="center">
        <div class="w-100 full-page-container-size">
          <slot></slot>
        </div>
      </v-row>
    </template>
  </v-container>
</template>

<script lang="ts">
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
  },
  setup() {
    return { LayoutTemplates };
  },
};
</script>
