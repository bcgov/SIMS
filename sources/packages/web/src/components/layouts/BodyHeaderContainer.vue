<template>
  <div>
    <!-- Header slot (with and without v-card) -->
    <v-card v-if="card"><slot name="header"></slot></v-card>
    <div v-else><slot name="header"></slot></div>

    <!-- Default slot (with and without v-card) -->
    <v-card v-if="card" class="mt-n1"><slot></slot></v-card>
    <div v-else class="mt-n1"><slot></slot></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    card: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup() {
    return {};
  },
});
</script>
