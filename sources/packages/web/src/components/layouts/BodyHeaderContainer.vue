<template>
  <div>
    <v-card v-if="card"><slot name="header"></slot></v-card>
    <div v-else><slot name="header"></slot></div>
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
