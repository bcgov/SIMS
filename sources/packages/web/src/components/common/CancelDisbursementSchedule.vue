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
  <user-note-confirm-modal
    title="Confirm cancellation"
    ref="confirmCancellationModal"
    okLabel="Cancel e-Cert now"
    cancelLabel="Cancel"
  >
    <template #content>
      <p>Are you sure you would like to have the e-Cert cancelled?</p>
    </template>
    ></user-note-confirm-modal
  >
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { Role } from "@/types";
import { ModalDialog, useSnackBar } from "@/composables";
import UserNoteConfirmModal, {
  UserNoteModal,
} from "@/components/common/modals/UserNoteConfirmModal.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { DisbursementScheduleService } from "@/services/DisbursementScheduleService";

export default defineComponent({
  emits: {
    disbursementScheduleCancelled: null,
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
        snackBar.success("e-Cert cancelled.");
        emit("disbursementScheduleCancelled");
        return true;
      } catch {
        snackBar.error(
          "An unexpected error happened while cancelling the e-Cert.",
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
