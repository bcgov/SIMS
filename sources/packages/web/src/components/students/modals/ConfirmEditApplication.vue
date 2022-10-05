<template>
  <modal-dialog-base
    title="Confirm Edit Application"
    :showDialog="showDialog"
    max-width="730"
  >
    <template #content>
      <p>
        This will result in a new assessment which could cause a delay in your
        application, are you sure you want to proceed?
      </p>
    </template>
    <template #:footer>
      <footer-buttons
        primaryLabel="Yes"
        secondaryLabel="No"
        @primaryClick="editApplication"
        @secondaryClick="dialogClosed"
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
  setup() {
    const { showDialog, resolvePromise, showModal } = useModalDialog<boolean>();

    const dialogClosed = () => {
      resolvePromise(false);
    };
    const editApplication = async () => {
      resolvePromise(true);
    };
    return {
      showDialog,
      showModal,
      dialogClosed,
      editApplication,
    };
  },
};
</script>
