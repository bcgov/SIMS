<template>
  <v-row :justify="justify" class="mt-2 mb-1">
    <v-btn
      :disabled="processing"
      :color="secondaryButtonColor"
      :variant="secondaryButtonVariant"
      class="mr-2"
      v-if="showSecondaryButton"
      data-cy="secondaryFooterButton"
      @click="$emit('secondaryClick')"
      >{{ secondaryLabel }}</v-btn
    >
    <slot name="primary-buttons" :disabled="processing || disablePrimaryButton">
      <v-btn
        :disabled="processing || disablePrimaryButton"
        v-if="showPrimaryButton"
        class="ml-2"
        variant="elevated"
        data-cy="primaryFooterButton"
        :color="primaryButtonColor"
        @click="$emit('primaryClick')"
        :loading="processing"
      >
        {{ primaryLabel }}</v-btn
      >
    </slot>
  </v-row>
</template>
<script lang="ts">
import { defineComponent, PropType } from "vue";
export default defineComponent({
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
      required: false,
      default: false,
    },
    showSecondaryButton: {
      type: Boolean,
      required: false,
      default: true,
    },
    showPrimaryButton: {
      type: Boolean,
      required: false,
      default: true,
    },
    primaryButtonColor: {
      type: String,
      required: false,
      default: "primary",
    },
    secondaryButtonColor: {
      type: String,
      required: false,
      default: "primary",
    },
    secondaryButtonVariant: {
      type: String as PropType<
        | "elevated"
        | "outlined"
        | "text"
        | "flat"
        | "tonal"
        | "plain"
        | undefined
      >,
      required: false,
      default: "outlined",
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
});
</script>
