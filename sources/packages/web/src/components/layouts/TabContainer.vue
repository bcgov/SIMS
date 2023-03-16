<template>
  <div class="mt-8">
    <!-- Default slot (with and without v-card) -->
    <v-card v-if="card" class="p-4"><slot></slot></v-card>
    <slot v-else></slot>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    card: {
      type: Boolean,
      required: false,
      default: true,
    },
    fullWidth: {
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
