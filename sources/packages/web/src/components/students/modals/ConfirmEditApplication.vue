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
import { computed, defineComponent } from "vue";

export default defineComponent({
  props: {
    isBeforeApplicationEdit: {
      type: Boolean,
      required: false,
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

    const confirmationText = computed(() =>
      props.isBeforeApplicationEdit ? "Edit application" : "Submit",
    );
    const warningText = computed(() =>
      props.isBeforeApplicationEdit
        ? `Any edits made to your application may require the resubmission of
        supporting information, potentially delaying your application. Are you
        sure you want to proceed?`
        : `Any edits made to your application may result in a new assessment, 
        potentially delaying your application. Are you sure you want to proceed?`,
    );

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
