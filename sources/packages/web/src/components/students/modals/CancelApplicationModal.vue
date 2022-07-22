<template>
  <Dialog
    v-if="showModal"
    :visible="showModal"
    :modal="true"
    :style="{ width: '50vw' }"
    :closable="false"
  >
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
        variant="outlined"
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
import { useSnackBar } from "@/composables";
import { ApplicationStatusToBeUpdatedDto, ApplicationStatus } from "@/types";

export default {
  components: {
    Dialog,
  },
  props: {
    showModal: {
      type: Boolean,
      required: true,
    },
    applicationId: {
      type: Number,
      required: true,
    },
  },
  emits: ["showHideCancelApplication", "reloadData"],
  setup(props: any, context: any) {
    const snackBar = useSnackBar();
    const updateShowCancelApplicationModal = () => {
      context.emit("showHideCancelApplication");
    };
    const confirmCancelApplicationModal = async () => {
      try {
        const payload: ApplicationStatusToBeUpdatedDto = {
          applicationStatus: ApplicationStatus.cancelled,
        };
        await ApplicationService.shared.updateStudentApplicationStatus(
          props.applicationId,
          payload,
        );
        updateShowCancelApplicationModal();
        context.emit("reloadData", props.applicationId);
        snackBar.success("Your application is now cancelled!");
      } catch (error) {
        snackBar.error("An error happened while cancelling the Application.");
      }
    };
    return {
      updateShowCancelApplicationModal,
      confirmCancelApplicationModal,
    };
  },
};
</script>
