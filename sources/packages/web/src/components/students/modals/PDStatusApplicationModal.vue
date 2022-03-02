<template>
  <ModalDialogBase
    title="Apply for a permanent disability status"
    :showDialog="showModal"
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
      <v-btn outlined color="primary" @click="hidePDApplicationModal()"
        >No</v-btn
      >
      <v-btn color="primary" @click="applyPDStatus()">Yes</v-btn>
    </template>
  </ModalDialogBase>
</template>

<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";

export default {
  components: {
    ModalDialogBase,
  },
  props: {
    showModal: {
      type: Boolean,
      required: true,
    },
  },
  setup(props: any, context: any) {
    const applyPDStatus = () => {
      context.emit("applyPDStatus");
    };

    const hidePDApplicationModal = () => {
      context.emit("hidePDApplicationModal");
    };

    return {
      applyPDStatus,
      hidePDApplicationModal,
    };
  },
};
</script>
