<template>
  <v-row :justify="justify" class="mt-2 mb-1">
    <v-btn
      :disabled="processing"
      color="primary"
      variant="outlined"
      class="mr-2"
      v-if="showSecondaryButton"
      data-cy="secondaryFooterButton"
      @click="$emit('secondaryClick')"
      >{{ secondaryLabel }}</v-btn
    >
    <v-btn
      :disabled="processing || disablePrimaryButton"
      v-if="showPrimaryButton"
      class="ml-2"
      variant="elevated"
      data-cy="primaryFooterButton"
      color="primary"
      @click="$emit('primaryClick')"
    >
      <v-progress-circular
        v-if="processing"
        bg-color="white"
        indeterminate
        color="secondary"
        class="ml-2"
        :size="20"
      />{{ primaryLabel }}</v-btn
    ></v-row
  >
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
    showSecondaryButton: {
      type: Boolean,
      required: true,
      default: true,
    },
    showPrimaryButton: {
      type: Boolean,
      required: false,
      default: true,
    },
    justify: {
      type: String,
      required: false,
      default: "center",
    },
    disablePrimaryButton: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
};
</script>
