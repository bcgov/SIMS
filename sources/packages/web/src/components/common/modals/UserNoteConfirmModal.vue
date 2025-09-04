<template>
  <v-form ref="modalNotesForm">
    <modal-dialog-base
      :title="title"
      :showDialog="showDialog"
      :maxWidth="maxWidth"
    >
      <template #content>
        <error-summary :errors="modalNotesForm.errors" />
        <slot name="content">{{ text }}</slot>
        <v-textarea
          :label="notesLabel"
          variant="outlined"
          hide-details="auto"
          v-model="note"
          :rules="[(v) => checkNotesLengthRule(v, notesLabel)]"
          required
        />
      </template>
      <template #footer>
        <footer-buttons
          :primaryLabel="okLabel"
          :secondaryLabel="cancelLabel"
          @primaryClick="resolvePromise(true)"
          @secondaryClick="resolvePromise(false)"
          :disablePrimaryButton="disablePrimaryButton"
          :showSecondaryButton="showSecondaryButton"
          :processing="loading"
        />
      </template>
    </modal-dialog-base>
  </v-form>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog, useRules } from "@/composables";
import { VForm } from "@/types";

export interface UserNoteModal<T> {
  showParameter: T;
  note: string;
}

export default defineComponent({
  components: {
    ModalDialogBase,
  },
  props: {
    title: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: false,
    },
    okLabel: {
      type: String,
      required: true,
      default: "Ok",
    },
    cancelLabel: {
      type: String,
      required: true,
      default: "Cancel",
    },
    maxWidth: {
      type: Number,
      required: false,
    },
    disablePrimaryButton: {
      type: Boolean,
      required: false,
      default: false,
    },
    showSecondaryButton: {
      type: Boolean,
      required: false,
      default: true,
    },
    notesLabel: {
      type: String,
      required: true,
      default: "Notes",
    },
  },
  setup() {
    const { checkNotesLengthRule } = useRules();
    const {
      loading,
      showDialog,
      resolvePromise: internalResolvePromise,
      showModal,
      showParameter,
    } = useModalDialog<UserNoteModal<unknown> | false>();
    const modalNotesForm = ref({} as VForm);
    const note = ref("");

    const resolvePromise = async (value: boolean) => {
      if (!value) {
        // Resets the form and closes the modal.
        modalNotesForm.value.reset();
        await internalResolvePromise(false);
        return;
      }
      // Validates the form.
      const validationResult = await modalNotesForm.value.validate();
      if (!validationResult.valid) {
        // Keeps the form open to allow the user to fix the validation.
        return;
      }
      const resolved = await internalResolvePromise({
        showParameter: showParameter.value,
        note: note.value,
      });
      if (resolved) {
        // Reset the form if the promise was resolved.
        modalNotesForm.value.reset();
      }
    };

    return {
      checkNotesLengthRule,
      modalNotesForm,
      note,
      showDialog,
      showModal,
      resolvePromise,
      loading,
    };
  },
});
</script>
