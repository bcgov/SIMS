<template>
  <Dialog
    v-if="showModal"
    :visible="showModal"
    :modal="true"
    :style="{ width: '50vw' }"
    :closable="false"
  >
    <template #header
      ><p class="font-weight-bold h5">
        Apply for permanent disability status
      </p></template
    >
    <p>
      If you’re eligible, you may receive funding for provincial and federal
      grants/bursaries. Your information will be sent to Assistive Technology BC
      (ATBC).
    </p>
    <p>
      Would you like to continue to apply for Permanent Disability Status with
      StudentAid BC?
    </p>
    <template #footer>
      <v-btn outlined color="primary" @click="hidePDApplicationModal()"
        >No</v-btn
      >
      <v-btn color="primary" @click="applyPDStatus()">Yes</v-btn>
    </template>
  </Dialog>
</template>

<script lang="ts">
import Dialog from "primevue/dialog";

export default {
  components: {
    Dialog,
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
