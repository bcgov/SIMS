<template>
  <modal-dialog-base title="Edit application" :showDialog="showDialog">
    <template #content>
      Editing your application will result in a new assessment, which could
      delay your application. <strong>Are you sure you want to proceed?</strong>
    </template>
    <template #footer>
      <footer-buttons
        primaryLabel="Edit application now"
        secondaryLabel="No"
        @primaryClick="editApplication"
        @secondaryClick="dialogClosed"
      />
    </template>
  </modal-dialog-base>
</template>

<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";
import { defineComponent } from "vue";

export default defineComponent({
  components: {
    ModalDialogBase,
  },
  setup() {
    const { showDialog, resolvePromise, showModal } = useModalDialog<boolean>();
    const dialogClosed = () => {
      resolvePromise(false);
    };
    const editApplication = async () => {
      resolvePromise(true);
    };
    return {
      showDialog,
      showModal,
      dialogClosed,
      editApplication,
    };
  },
});
</script>
