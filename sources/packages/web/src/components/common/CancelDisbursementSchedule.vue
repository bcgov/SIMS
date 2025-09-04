<template>
  <check-permission-role :role="Role.StudentCancelDisbursementSchedule">
    <template #="{ notAllowed }">
      <v-btn
        variant="outlined"
        color="primary"
        prepend-icon="fa:fa fa-xmark"
        @click="cancelDisbursementSchedule"
        :disabled="notAllowed"
        ><span class="text-decoration-underline font-bold"
          >Cancel eCert</span
        ></v-btn
      >
    </template>
  </check-permission-role>
  <user-note-confirm-modal
    title="Cancel eCert"
    notes-label="Cancellation reason"
    ref="confirmCancellationModal"
    okLabel="Confirm"
    cancelLabel="Cancel"
  >
    <template #content>
      <p>
        You are requesting the cancellation of an eCert. This action should be
        communicated to the NSLSC prior to proceeding.
      </p>
      <p>Note:</p>
      <ul>
        <li>
          Cancelling the eCert does not stop any future pending disbursements.
        </li>
        <li>It does not trigger a reassessment of the application.</li>
        <li>
          Please ensure all necessary changes are made before initiating a
          reassessment to generate new disbursements.
        </li>
        <li>
          Any overawards created or deducted as a result of this eCert will also
          be reversed as part of this action.
        </li>
      </ul>
    </template>
    ></user-note-confirm-modal
  >
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { ApiProcessError, Role } from "@/types";
import { ModalDialog, useSnackBar } from "@/composables";
import UserNoteConfirmModal, {
  UserNoteModal,
} from "@/components/common/modals/UserNoteConfirmModal.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { DisbursementScheduleService } from "@/services/DisbursementScheduleService";

export default defineComponent({
  emits: {
    disbursementCancelled: (disbursementId: number) => {
      return !!disbursementId;
    },
  },
  components: { UserNoteConfirmModal, CheckPermissionRole },
  props: {
    disbursementId: {
      type: Number,
      required: false,
    },
  },
  setup(props, { emit }) {
    const snackBar = useSnackBar();
    const confirmCancellationModal = ref(
      {} as ModalDialog<UserNoteModal<number>>,
    );

    const cancelDisbursementSchedule = async () => {
      await confirmCancellationModal.value.showModal(
        props.disbursementId,
        cancelDisbursement,
      );
    };

    const cancelDisbursement = async (
      userNoteModalResult: UserNoteModal<number>,
    ): Promise<boolean> => {
      try {
        await DisbursementScheduleService.shared.cancelDisbursementSchedule(
          userNoteModalResult.showParameter,
          { note: userNoteModalResult.note },
        );
        snackBar.success("The disbursement has been successfully cancelled.");
        emit("disbursementCancelled", userNoteModalResult.showParameter);
        return true;
      } catch (error: unknown) {
        if (error instanceof ApiProcessError) {
          snackBar.error(error.message);
          return false;
        }
        snackBar.error(
          "An unexpected error happened while cancelling the eCert.",
        );
      }
      return false;
    };

    return {
      cancelDisbursementSchedule,
      confirmCancellationModal,
      Role,
    };
  },
});
</script>
