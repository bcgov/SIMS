<template>
  <modal-dialog-base title="Edit application" :showDialog="showDialog">
    <template #content>
      {{
        props.isBeforeApplicationEdit
          ? "Any edits made to your application may require the resubmission of " +
            "supporting information, potentially delaying your application. Are you " +
            "sure you want to proceed?"
          : "Any edits made to your application may result in a new assessment, " +
            "potentially delaying your application. Are you sure you want to proceed?"
      }}
    </template>
    <template #footer>
      <footer-buttons
        :primaryLabel="
          props.isBeforeApplicationEdit ? 'Edit application' : 'Submit'
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
    isBeforeApplicationEdit: {
      type: Boolean,
      required: false,
      default: false,
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

    return {
      showDialog,
      showModal,
      dialogClosed,
      editApplication,
      props,
    };
  },
});
</script>
