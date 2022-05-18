<template>
  <v-container>
    <header class="mb-4">
      <slot name="header"></slot>
    </header>
    <template v-if="layoutType === 'card'">
      <v-row justify="center">
        <v-card class="w-100 full-page-container-size">
          <slot></slot>
        </v-card>
      </v-row>
    </template>
    <template v-else-if="layoutType === 'full-wide'">
      <div class="w-100">
        <slot></slot>
      </div>
    </template>
    <template v-else>
      <v-row justify="center">
        <div class="w-100 full-page-container-size">
          <slot></slot>
        </div>
      </v-row>
    </template>
  </v-container>
</template>
<script lang="ts">
export default {
  props: {
    layoutType: {
      type: String,
    },
  },
};
</script>
