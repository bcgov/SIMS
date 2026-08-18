<template>
  <v-form ref="modalNotesForm">
    <modal-dialog-base
      :title="title"
      :show-dialog="showDialog"
      :max-width="maxWidth"
    >
      <template #content>
        <error-summary :errors="modalNotesForm.errors" />
        <slot name="content" :show-parameter="showParameter">{{ text }}</slot>
        <v-textarea
          v-if="showNotes"
          :label="notesLabel"
          variant="outlined"
          hide-details="auto"
          v-model="note"
          :rules="[(v) => checkNotesLengthRule(v, notesLabel)]"
          required
        />
        <p class="brand-gray-text" v-if="notesDescription">
          {{ notesDescription }}
        </p>
      </template>
      <template #footer>
        <check-permission-role v-if="allowedRole" :role="allowedRole">
          <template #="{ notAllowed }">
            <footer-buttons
              :primary-label="okLabel"
              :secondary-label="cancelLabel"
              @primary-click="resolvePromise(true)"
              @secondary-click="resolvePromise(false)"
              :disable-primary-button="disablePrimaryButton || notAllowed"
              :show-secondary-button="showSecondaryButton"
              :processing="loading"
            />
          </template>
        </check-permission-role>

        <footer-buttons
          v-else
          :primary-label="okLabel"
          :secondary-label="cancelLabel"
          @primary-click="resolvePromise(true)"
          @secondary-click="resolvePromise(false)"
          :disable-primary-button="disablePrimaryButton"
          :show-secondary-button="showSecondaryButton"
          :processing="loading"
        />
      </template>
    </modal-dialog-base>
  </v-form>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { useModalDialog, useRules } from "@/composables";
import { Role, VForm } from "@/types";

export interface UserNoteModal<T> {
  showParameter: T;
  note: string;
}

export default defineComponent({
  components: {
    CheckPermissionRole,
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
      default: undefined,
    },
    okLabel: {
      type: String,
      default: "Ok",
    },
    cancelLabel: {
      type: String,
      default: "Cancel",
    },
    maxWidth: {
      type: Number,
      required: false,
      default: undefined,
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
      default: "Notes",
    },
    notesDescription: {
      type: String,
      default: undefined,
    },
    showNotes: {
      type: Boolean,
      default: true,
    },
    allowedRole: {
      type: String as PropType<Role>,
      required: false,
      default: undefined,
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
      showParameter,
    };
  },
});
</script>
