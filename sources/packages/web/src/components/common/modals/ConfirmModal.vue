<template>
  <modal-dialog-base
    :title="title"
    dialogType="warning"
    :showDialog="showDialog"
    :maxWidth="maxWidth"
    @click="extendTime"
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
      />
    </template>
  </modal-dialog-base>
</template>

<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";

export default {
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
  },
  setup() {
    const { showDialog, resolvePromise, showModal } = useModalDialog<boolean>();
    return {
      showDialog,
      showModal,
      resolvePromise,
    };
  },
};
</script>
