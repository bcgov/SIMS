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
        Do you want to confirm this application?
      </p></template
    >
    <p>
      Confirming enrollment verifies this applicant is attending your
      institution and will allow funding to be disbursed.
    </p>
    <template #footer>
      <v-btn
        outlined
        class="float-left"
        color="primary"
        @click="updateShowConfirmCOEModal()"
        >Cancel</v-btn
      >
      <v-btn color="success" class="text-white" @click="confirmEnrollment()"
        >Continue to Confirmation</v-btn
      >
    </template>
  </Dialog>
</template>
<script lang="ts">
import Dialog from "primevue/dialog";
import { useToastMessage } from "@/composables";
import { ConfirmationOfEnrollmentService } from "@/services/ConfirmationOfEnrollmentService";
export const FIRST_COE_NOT_COMPLETE = "FIRST_COE_NOT_COMPLETE";

export default {
  components: {
    Dialog,
  },
  props: {
    showModal: {
      type: Boolean,
      required: true,
    },
    disbursementScheduleId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: true,
    },
  },

  emits: ["showHideConfirmCOE", "reloadData"],
  setup(props: any, context: any) {
    const toast = useToastMessage();
    const updateShowConfirmCOEModal = () => {
      context.emit("showHideConfirmCOE");
    };
    const confirmEnrollment = async () => {
      try {
        await ConfirmationOfEnrollmentService.shared.confirmCOE(
          props.locationId,
          props.disbursementScheduleId,
        );
        toast.success("Confirmed", "Confirmation of Enrollment Confirmed!");
      } catch (error) {
        let errorLabel = "Unexpected error";
        let errorMessage = "An error happened while confirming the COE.";
        if (error.response.data?.errorType === FIRST_COE_NOT_COMPLETE) {
          errorMessage = error.response.data.message;
          errorLabel = error.response.data.errorType;
        }
        toast.error(errorLabel, errorMessage);
      }
      updateShowConfirmCOEModal();
      context.emit("reloadData");
    };

    return {
      updateShowConfirmCOEModal,
      confirmEnrollment,
    };
  },
};
</script>
