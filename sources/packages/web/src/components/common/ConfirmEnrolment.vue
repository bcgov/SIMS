<template>
  <check-permission-role :role="Role.StudentConfirmEnrolment">
    <template #="{ notAllowed }">
      <v-btn
        v-if="isConfirmCOEEnabled"
        variant="outlined"
        color="primary"
        prepend-icon="fa:fa fa-check"
        @click="submitConfirmEnrolment"
        :disabled="notAllowed"
        ><span class="text-decoration-underline font-bold"
          >Confirm Enrolment</span
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
      ><span class="font-bold"
        >Are you sure you want to confirm enrolment for this application?</span
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
import { COEStatus, Role, ApplicationStatus } from "@/types";
import { ModalDialog } from "@/composables";
import ConfirmModal from "@/components/common/modals/ConfirmModal.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

export default defineComponent({
  emits: {
    confirmEnrolment: (disbursementId: number) => {
      return !!disbursementId;
    },
  },
  components: { ConfirmModal, CheckPermissionRole },
  props: {
    coeStatus: {
      type: String as PropType<COEStatus>,
      required: true,
    },
    applicationStatus: {
      type: String as PropType<ApplicationStatus>,
      required: true,
    },
    disbursementId: {
      type: Number,
      required: true,
    },
  },
  setup(props, context) {
    const confirmEnrolmentModal = ref({} as ModalDialog<boolean>);
    const isConfirmCOEEnabled = computed<boolean>(
      () =>
        !!(
          props.coeStatus === COEStatus.required &&
          (props.applicationStatus === ApplicationStatus.Enrolment ||
            props.applicationStatus === ApplicationStatus.Completed)
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
