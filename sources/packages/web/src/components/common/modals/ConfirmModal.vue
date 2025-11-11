<template>
  <modal-dialog-base
    :title="title"
    dialog-type="warning"
    :show-dialog="showDialog"
    :max-width="maxWidth"
  >
    <template #content>
      <slot name="content">{{ text }}</slot>
    </template>
    <template #footer>
      <footer-buttons
        :primary-label="okLabel"
        :secondary-label="cancelLabel"
        @primary-click="resolvePromise(true)"
        @secondary-click="resolvePromise(false)"
        :disable-primary-button="disablePrimaryButton"
        :show-secondary-button="showSecondaryButton"
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
      default: undefined,
    },
    okLabel: {
      type: String,
      required: true,
      default: "Ok",
    },
    cancelLabel: {
      type: String,
      required: false,
      default: "Cancel",
    },
    maxWidth: {
      type: Number,
      required: false,
      default: undefined,
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
