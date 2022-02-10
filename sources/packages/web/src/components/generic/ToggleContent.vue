<template>
  <div v-if="toggled">
    <v-row justify="center" class="mt-4">
      <slot name="image"></slot>
    </v-row>
    <v-row justify="center m-4">
      <slot name="message">
        {{ message }}
      </slot>
    </v-row>
  </div>
  <slot v-else></slot>
</template>

<script lang="ts">
export default {
  props: {
    toggled: {
      type: Boolean,
      required: true,
    },
    message: {
      type: Boolean,
      required: true,
    },
  },
};
</script>
