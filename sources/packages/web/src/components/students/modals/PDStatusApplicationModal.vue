<template>
  <modal-dialog-base
    title="Apply for a Disability Status"
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
        primaryLabel="Close"
        @primaryClick="resolvePromise(false)"
        :showSecondaryButton="false"
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

    return {
      resolvePromise,
      showDialog,
      showModal,
    };
  },
});
</script>
