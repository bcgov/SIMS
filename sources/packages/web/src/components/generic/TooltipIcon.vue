<template>
  <v-tooltip :location="location">
    <template #activator="{ props }">
      <v-icon
        icon="fa:fas fa-circle-question"
        class="mx-2"
        color="secondary"
        size="16"
        v-bind="props"
      />
    </template>
    <slot></slot>
  </v-tooltip>
</template>

<script lang="ts">
export default {
  props: {
    location: {
      type: String,
      required: false,
      default: "right",
    },
  },
};
</script>
