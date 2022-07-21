<template>
  <ModalDialogBase
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
      <v-row>
        <v-col>
          <v-btn variant="outlined" color="primary" @click="requestPD(false)"
            >No</v-btn
          >
        </v-col>
        <v-col>
          <v-btn color="primary" @click="requestPD(true)">Yes</v-btn>
        </v-col>
      </v-row>
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
