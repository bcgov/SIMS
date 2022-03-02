<template>
  <ModalDialogBase
    title="Apply for a permanent disability status"
    :showDialog="showDialog"
  >
    <template v-slot:content>
      <v-container>
        <p>
          If you’re eligible, you may receive funding for provincial and federal
          grants/bursaries. Your information will be sent to Assistive
          Technology BC (ATBC).
        </p>
      </v-container>
    </template>
    <template v-slot:footer>
      <v-btn outlined color="primary" @click="requestPD(false)">No</v-btn>
      <v-btn color="primary" @click="requestPD(true)">Yes</v-btn>
    </template>
  </ModalDialogBase>
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
    const requestPD = async (payload: boolean) => {
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
