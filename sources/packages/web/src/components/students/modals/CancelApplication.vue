<template>
  <modal-dialog-base title="Cancel application" :showDialog="showDialog">
    <template #content>
      Cancelling your application will stop your application from going forward.
      After cancelling, you can still view your application but will not be able
      to make further edits to it.
      <strong>Are you sure you want to proceed?</strong>
    </template>
    <template #footer>
      <footer-buttons
        primaryLabel="Cancel application now"
        secondaryLabel="No"
        @primaryClick="cancelApplication"
        @secondaryClick="dialogClosed"
      />
    </template>
  </modal-dialog-base>
</template>

<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog, useSnackBar } from "@/composables";
import { ApplicationService } from "@/services/ApplicationService";
import { defineComponent } from "vue";

export default defineComponent({
  components: {
    ModalDialogBase,
  },
  setup() {
    const {
      showDialog,
      resolvePromise,
      showModal: showModalInternal,
    } = useModalDialog<boolean>();
    const snackBar = useSnackBar();

    const dialogClosed = () => {
      resolvePromise(false);
    };

    let applicationId = 0;

    // Show the modal and loads the user information.
    const showModal = async (id: number): Promise<boolean> => {
      applicationId = id;

      // Call the modal method to show the modal.
      return showModalInternal();
    };

    const cancelApplication = async () => {
      try {
        await ApplicationService.shared.cancelStudentApplication(applicationId);
        resolvePromise(true);
        snackBar.success("Your application is now cancelled!");
      } catch (error) {
        snackBar.error("An error happened while cancelling the Application.");
        resolvePromise(false);
      }
    };

    return {
      showDialog,
      showModal,
      dialogClosed,
      cancelApplication,
    };
  },
});
</script>
