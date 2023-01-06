<template>
  <status-info-enrolment :coeStatus="coeStatus" />
  <check-permission-role :role="Role.StudentConfirmEnrolment">
    <template #="{ notAllowed }">
      <v-btn
        v-if="isConfirmCOEEnabled"
        variant="text"
        color="primary"
        @click="submitConfirmEnrolment"
        :disabled="notAllowed"
        ><span class="text-decoration-underline"
          ><strong>Confirm Enrolment</strong></span
        ></v-btn
      >
    </template>
  </check-permission-role>

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
import { StatusInfo, COEStatus, Role, ApplicationStatus } from "@/types";
import { ModalDialog } from "@/composables";
import StatusInfoEnrolment from "@/components/common/StatusInfoEnrolment.vue";
import ConfirmModal from "@/components/common/modals/ConfirmModal.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

export interface EnrollmentStatusInfo {
  status: StatusInfo;
  header: string;
}

export default defineComponent({
  emits: ["confirmEnrolment"],
  components: { StatusInfoEnrolment, ConfirmModal, CheckPermissionRole },
  props: {
    coeStatus: {
      type: Object as PropType<COEStatus>,
      required: true,
    },
    applicationStatus: {
      type: Object as PropType<ApplicationStatus>,
      required: false,
    },
    disbursementId: {
      type: Number,
      required: false,
    },
    allowConfirmEnrolment: {
      type: Boolean,
      required: false,
    },
  },
  setup(props, context) {
    const confirmEnrolmentModal = ref({} as ModalDialog<boolean>);
    const isConfirmCOEEnabled = computed<boolean>(
      () =>
        !!(
          props.allowConfirmEnrolment &&
          props.coeStatus === COEStatus.required &&
          (props.applicationStatus === ApplicationStatus.enrollment ||
            props.applicationStatus === ApplicationStatus.completed)
        ),
    );
    const submitConfirmEnrolment = async () => {
      const enrolmentConfirmation =
        await confirmEnrolmentModal.value.showModal();
      if (enrolmentConfirmation) {
        context.emit("confirmEnrolment", props.disbursementId);
      }
    };
    return {
      isConfirmCOEEnabled,
      submitConfirmEnrolment,
      confirmEnrolmentModal,
      Role,
    };
  },
});
</script>
