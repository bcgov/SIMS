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
      institution and will allow funding to be dispersed.
    </p>
    <template #footer>
      <v-btn
        outlined
        class="float-left"
        color="primary"
        @click="updateShowConfirmCOEModal()"
        >Cancel</v-btn
      >
      <v-btn color="success" class="text-white" @click="confirmEntrollment()"
        >Continue to Confirmation</v-btn
      >
    </template>
  </Dialog>
</template>
<script lang="ts">
import Dialog from "primevue/dialog";
import { useToastMessage } from "@/composables";
import { ConfirmationOfEnrollmentService } from "@/services/ConfirmationOfEnrollmentService";

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
    const confirmEntrollment = async () => {
      try {
        await ConfirmationOfEnrollmentService.shared.confirmCOE(
          props.locationId,
          props.applicationId,
        );
        toast.success("Confirmed", "Confirmation of Enrollment Confirmed!");
      } catch (error) {
        toast.error(
          "Unexpected error",
          "An error happened while confirming the COE.",
        );
      }
      updateShowConfirmCOEModal();
      context.emit("reloadData", props.applicationId);
    };

    return {
      updateShowConfirmCOEModal,
      confirmEntrollment,
    };
  },
};
</script>
