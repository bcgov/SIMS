<template>
  <modal-dialog-base title="Edit application" :showDialog="showDialog">
    <template #content>
      {{ warningText }}
    </template>
    <template #footer>
      <footer-buttons
        :primaryLabel="confirmationText"
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
    beforeEdit: {
      type: Boolean,
      required: true,
    },
  },
  components: {
    ModalDialogBase,
  },
  setup(props) {
    const { showDialog, resolvePromise, showModal } = useModalDialog<boolean>();
    const dialogClosed = () => {
      resolvePromise(false);
    };
    const editApplication = async () => {
      resolvePromise(true);
    };

    let confirmationText = "Submit";
    let warningText = `Any edits made to your application may result in a new assessment, 
    potentially delaying your application. Are you sure you want to proceed?`;

    if (props.beforeEdit) {
      confirmationText = "Edit application";
      warningText = `Any edits made to your application may require the resubmission of
      supporting information, potentially delaying your application. Are you
      sure you want to proceed?`;
    }

    return {
      showDialog,
      showModal,
      dialogClosed,
      editApplication,
      confirmationText,
      warningText,
    };
  },
});
</script>
