<template>
  <modal-dialog-base title="Edit application" :showDialog="showDialog">
    <template #content>
      Any edits made to your application may require the resubmission of
      supporting information, potentially delaying your application. Are you
      sure you want to proceed?
    </template>
    <template #footer>
      <footer-buttons
        :primaryLabel="
          $props.confirmationText ? $props.confirmationText : 'Edit application'
        "
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
  props: {
    confirmationText: {
      type: String,
      required: false,
    },
  },
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
