<template>
  <v-row :justify="justify" class="mt-2 mb-1">
    <v-btn
      :disabled="processing"
      color="primary"
      variant="outlined"
      class="mr-2"
      data-cy="secondaryFooterButton"
      @click="$emit('secondaryClick')"
      >{{ secondaryLabel }}</v-btn
    >
    <v-btn
      :disabled="processing"
      class="primary-btn-background ml-2"
      data-cy="primaryFooterButton"
      @click="$emit('primaryClick')"
    >
      {{ primaryLabel }}
      <v-progress-circular
        v-if="processing"
        indeterminate
        class="ml-2"
        :size="20" /></v-btn
  ></v-row>
</template>
<script lang="ts">
export default {
  emits: ["primaryClick", "secondaryClick"],
  props: {
    primaryLabel: {
      type: String,
      required: true,
      default: "Submit",
    },
    secondaryLabel: {
      type: String,
      required: false,
      default: "Cancel",
    },
    processing: {
      type: Boolean,
      required: true,
      default: false,
    },
    justify: {
      type: String,
      required: true,
      default: "center",
    },
  },
};
</script>
