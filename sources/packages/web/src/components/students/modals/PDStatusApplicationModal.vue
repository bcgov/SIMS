<template>
  <modal-dialog-base
    title="Apply for a permanent disability status"
    :showDialog="showDialog"
  >
    <template v-slot:content>
      <p>
        If you're eligible, you may receive funding for provincial and federal
        grants/bursaries. <strong>Would you like to continue?.</strong>
      </p>
    </template>
    <template v-slot:footer>
      <footer-buttons
        primaryLabel="Apply now"
        secondaryLabel="Cancel"
        @primaryClick="requestPD(true)"
        @secondaryClick="requestPD(false)"
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
});
</script>
