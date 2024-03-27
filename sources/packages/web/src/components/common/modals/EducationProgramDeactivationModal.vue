<template>
  <v-form ref="deactivateProgramForm">
    <modal-dialog-base
      :showDialog="showDialog"
      title="Confirm deactivation"
      ref="confirmDeactivationModal"
      ><template #content
        ><span class="font-bold"
          >Please confirm you no longer require this program?</span
        >
        <p class="mt-5">
          Confirming deactivation means that this will no longer be visible to
          students when starting an application. It wil not impact any students
          with active applications for offerings under this program. This action
          cannot be undone.
        </p>
        <v-textarea
          v-if="notesRequired"
          v-model="noteDescription"
          variant="outlined"
          label="Note"
          :rules="[checkNotesLengthRule]"
          required
          class="mt-4"
          hide-details="auto"
        ></v-textarea>
      </template>
      <template #footer>
        <footer-buttons
          primaryLabel="Confirm deactivation"
          primaryButtonColor="danger"
          @primaryClick="submit"
          @secondaryClick="cancel"
          :processing="loading"
        />
      </template>
    </modal-dialog-base>
  </v-form>
</template>
<script lang="ts">
import { ref, defineComponent } from "vue";
import { useModalDialog, useRules } from "@/composables";
import { VForm } from "@/types";
import { DeactivateProgramAPIInDTO } from "@/services/http/dto";

export default defineComponent({
  props: {
    notesRequired: {
      type: Boolean,
      required: true,
    },
  },
  setup() {
    const { showDialog, resolvePromise, showModal, loading, hideModal } =
      useModalDialog<DeactivateProgramAPIInDTO | boolean>();
    const { checkNotesLengthRule } = useRules();
    const noteDescription = ref("");
    const deactivateProgramForm = ref({} as VForm);

    const submit = async () => {
      const validationResult = await deactivateProgramForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      const payload = {
        note: noteDescription.value,
      };
      await resolvePromise(payload);
      deactivateProgramForm.value.reset();
    };

    const cancel = () => {
      deactivateProgramForm.value.reset();
      resolvePromise(false);
      hideModal();
    };

    return {
      noteDescription,
      deactivateProgramForm,
      showDialog,
      showModal,
      loading,
      checkNotesLengthRule,
      submit,
      cancel,
    };
  },
});
</script>
