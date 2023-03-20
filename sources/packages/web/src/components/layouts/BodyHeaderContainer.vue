<template>
  <div class="mb-5">
    <v-card v-if="enableCardView">
      <v-container><slot name="header"></slot><slot></slot></v-container>
    </v-card>
    <div v-else><slot name="header"></slot><slot></slot></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    enableCardView: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
});
</script>
