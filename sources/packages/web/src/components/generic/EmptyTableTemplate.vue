<template>
  <div v-if="isEmpty">
    <v-row justify="center" class="mt-4">
      <slot name="image"> </slot>
    </v-row>
    <v-row justify="center m-4">
      <slot name="message">
        {{ emptyMessage }}
      </slot>
    </v-row>
  </div>
  <slot v-else></slot>
</template>

<script lang="ts">
export default {
  props: {
    isEmpty: {
      type: Boolean,
      required: true,
    },
    emptyMessage: {
      type: Boolean,
      required: true,
    },
  },
};
</script>
