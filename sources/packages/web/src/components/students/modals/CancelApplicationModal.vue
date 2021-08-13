<template>
  <Dialog
    v-if="showModal"
    :visible="showModal"
    :modal="true"
    :style="{ width: '50vw' }"
    :closable="false"
  >
    {{ applicationID }}--{{ showModal }}
    <template #header
      ><p class="font-weight-bold h5">Cancel Application</p></template
    >
    <p class="font-weight-bold">
      Are you sure you want to cancel your application?
    </p>

    <p>
      You’ll still be able to view cancelled applications but can’t make futher
      edits.
    </p>
    <template #footer>
      <v-btn
        outlined
        class="float-left"
        color="primary"
        @click="updateShowCancelApplicationModal()"
        >Close</v-btn
      >
      <v-btn
        color="danger"
        class="text-white"
        @click="confirmCancelApplicationModal()"
        >Cancel Application</v-btn
      >
    </template>
  </Dialog>
</template>
<script lang="ts">
import { ApplicationService } from "@/services/ApplicationService";
import Dialog from "primevue/dialog";
import { useToastMessage } from "@/composables";
import {
  ApplicationStatusToBeUpdatedDto,
  ApplicationStatus,
} from "@/types/contracts/students/ApplicationContract";

export default {
  components: {
    Dialog,
  },
  props: {
    showModal: {
      type: Boolean,
      required: true,
    },
    applicationID: {
      type: Number,
      required: true,
    },
  },
  emits: ["showHidecancelApplication"],
  setup(props: any, context: any) {
    const toast = useToastMessage();
    const updateShowCancelApplicationModal = () => {
      context.emit("showHidecancelApplication");
    };
    const confirmCancelApplicationModal = async () => {
      try {
        const payload: ApplicationStatusToBeUpdatedDto = {
          applicationStatus: ApplicationStatus.cancelled,
        };
        alert(props.applicationID);
        await ApplicationService.shared.updateStudentApplicationStatus(
          props.applicationID,
          payload,
        );
        updateShowCancelApplicationModal();
        toast.success(
          "Application Cancelled",
          "Your application is now canceled!",
        );
      } catch (error) {
        toast.error(
          "Unexpected error",
          "An error happened while cancelling the Application.",
        );
      }
    };
    return {
      updateShowCancelApplicationModal,
      confirmCancelApplicationModal,
    };
  },
};
</script>
