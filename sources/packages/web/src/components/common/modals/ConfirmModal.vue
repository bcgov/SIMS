<template>
  <modal-dialog-base
    :title="title"
    dialogType="warning"
    :showDialog="showDialog"
    :maxWidth="maxWidth"
  >
    <template #content>
      <slot name="content">{{ text }}</slot>
    </template>
    <template #footer>
      <footer-buttons
        :primaryLabel="okLabel"
        :secondaryLabel="cancelLabel"
        @primaryClick="resolvePromise(true)"
        @secondaryClick="resolvePromise(false)"
        :disablePrimaryButton="disablePrimaryButton"
        :showSecondaryButton="showSecondaryButton"
        :processing="loading"
      />
    </template>
  </modal-dialog-base>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";

export default defineComponent({
  components: {
    ModalDialogBase,
  },
  props: {
    title: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: false,
    },
    okLabel: {
      type: String,
      required: true,
      default: "Ok",
    },
    cancelLabel: {
      type: String,
      required: true,
      default: "Cancel",
    },
    maxWidth: {
      type: Number,
      required: false,
    },
    disablePrimaryButton: {
      type: Boolean,
      required: false,
      default: false,
    },
    showSecondaryButton: {
      type: Boolean,
      required: false,
      default: true,
    },
    loading: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup() {
    const { showDialog, resolvePromise, showModal } = useModalDialog<boolean>();
    return {
      showDialog,
      showModal,
      resolvePromise,
    };
  },
});
</script>
