<template>
  <status-info-enrolment :coeStatus="coeStatus" />
  <v-btn
    v-if="showConfirmEnrolment"
    variant="text"
    color="primary"
    @click="confirmEnrolment"
    ><span class="text-decoration-underline"
      ><strong>Confirm Enrolment</strong></span
    ></v-btn
  >
  <confirm-modal
    title="Confirm enrolment"
    ref="confirmEnrolmentModal"
    okLabel="Confirm enrolment now"
    cancelLabel="Cancel"
    ><template #content
      ><strong
        >Are you sure you want to confirm enrolment for this
        application?</strong
      >
      <p class="mt-5">
        Confirming enrolment verifies this applicant is attending your
        institution and will allow funding to be disbursed.
      </p>
    </template></confirm-modal
  >
</template>

<script lang="ts">
import { PropType, computed, defineComponent, ref } from "vue";
import { StatusInfo, COEStatus, ApiProcessError } from "@/types";
import { useSnackBar, ModalDialog } from "@/composables";
import { ConfirmationOfEnrollmentService } from "@/services/ConfirmationOfEnrollmentService";
import { FIRST_COE_NOT_COMPLETE } from "@/constants";
import StatusInfoEnrolment from "@/components/common/StatusInfoEnrolment.vue";
import ConfirmModal from "@/components/common/modals/ConfirmModal.vue";

export interface EnrollmentStatusInfo {
  status: StatusInfo;
  header: string;
}

export default defineComponent({
  emits: ["enrollmentConfirmed"],
  components: { StatusInfoEnrolment, ConfirmModal },
  props: {
    coeStatus: {
      type: Object as PropType<COEStatus>,
      required: true,
    },
    disbursementId: {
      type: Number,
      required: true,
    },
    allowConfirmEnrolment: {
      type: Boolean,
      required: false,
    },
  },
  setup(props, context) {
    const snackBar = useSnackBar();
    const confirmEnrolmentModal = ref({} as ModalDialog<boolean>);
    const showConfirmEnrolment = computed<boolean>(
      () =>
        props.allowConfirmEnrolment && props.coeStatus === COEStatus.required,
    );
    const confirmEnrolment = async () => {
      try {
        const canConfirmEnrolment =
          await confirmEnrolmentModal.value.showModal();
        if (canConfirmEnrolment) {
          await ConfirmationOfEnrollmentService.shared.confirmEnrollment(
            props.disbursementId,
          );
          snackBar.success("Confirmation of Enrollment Confirmed!");
          context.emit("enrollmentConfirmed");
        }
      } catch (error: unknown) {
        if (
          error instanceof ApiProcessError &&
          error.errorType === FIRST_COE_NOT_COMPLETE
        ) {
          snackBar.error("First COE is not completed.");
        }
        snackBar.error("An error happened while confirming the COE.");
      }
    };
    return {
      showConfirmEnrolment,
      confirmEnrolment,
      confirmEnrolmentModal,
    };
  },
});
</script>
