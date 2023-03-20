<template>
  <div class="mt-8">
    <!-- Default slot (with and without v-card) -->
    <v-card v-if="enableCardView">
      <v-container><slot></slot></v-container>
    </v-card>
    <slot v-else></slot>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    enableCardView: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
});
</script>
