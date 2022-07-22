<template>
  <modal-dialog-base
    dialogType="question"
    title="Apply for a permanent disability status"
    :showDialog="showDialog"
  >
    <template v-slot:content>
      <p>
        If you’re eligible, you may receive funding for provincial and federal
        grants/bursaries. Your information will be sent to Assistive Technology
        BC (ATBC).
      </p>
    </template>
    <template v-slot:footer>
      <footer-buttons
        primaryLabel="Yes"
        secondaryLabel="No"
        @primaryClick="requestPD(true)"
        @secondaryClick="requestPD(false)"
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
    const { showDialog, showModal, resolvePromise } = useModalDialog<boolean>();
    const requestPD = (payload: boolean) => {
      showDialog.value = false;
      resolvePromise(payload);
    };

    return {
      requestPD,
      showDialog,
      showModal,
    };
  },
};
</script>
