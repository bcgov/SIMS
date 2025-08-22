<template>
  <check-permission-role :role="Role.StudentCancelDisbursementSchedule">
    <template #="{ notAllowed }">
      <v-btn
        class="d-block"
        variant="text"
        color="primary"
        @click="cancelDisbursementSchedule"
        :disabled="notAllowed"
        ><span class="text-decoration-underline font-bold"
          >Cancel certificate</span
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
import { defineComponent, ref } from "vue";
import { Role } from "@/types";
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
    disbursementId: {
      type: Number,
      required: false,
    },
  },
  setup() {
    const confirmEnrolmentModal = ref({} as ModalDialog<boolean>);

    const cancelDisbursementSchedule = () => {
      console.log("Cancel");
    };

    return {
      cancelDisbursementSchedule,
      confirmEnrolmentModal,
      Role,
    };
  },
});
</script>
