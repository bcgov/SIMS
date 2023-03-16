<template>
  <template v-if="card">
    <div class="mt-4 p-4">
      <v-card class="mt-4 p-4"><slot></slot></v-card>
    </div>
  </template>
  <template v-else>
    <div class="mt-4 p-4">
      <slot></slot>
    </div>
  </template>
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
  setup(props) {
    return {};
  },
});
</script>
