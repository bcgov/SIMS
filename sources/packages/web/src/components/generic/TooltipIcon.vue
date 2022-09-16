<template>
  <v-tooltip :location="location">
    <template #activator="{ props }">
      <v-icon
        icon="fa:fas fa-circle-question"
        class="tooltip-icon mx-2"
        v-bind="props"
      />
    </template>
    <span>{{ content }}</span>
  </v-tooltip>
</template>

<script lang="ts">
export default {
  props: {
    content: {
      type: String,
      required: true,
    },
    activator: {
      type: String,
      required: false,
      default: "parent",
    },
    location: {
      type: String,
      required: false,
      default: "right",
    },
  },
};
</script>
