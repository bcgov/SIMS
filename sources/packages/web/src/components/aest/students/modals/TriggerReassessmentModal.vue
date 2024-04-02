<template>
  <v-form ref="reassessmentForm">
    <modal-dialog-base :showDialog="showDialog" title="Trigger Reassessment">
      <template #content>
        <p class="pt-1 brand-gray-text">
          Triggering reassessment will not change student's application inputs
          currently on file. This will rerun the student's assessment,
          potentially requiring a school to reconfirm enrolment, and potentially
          new eCert requests to be issued. For more information, please consult
          the SIMS Operations Manual.
        </p>
        <v-textarea
          label="Notes"
          variant="outlined"
          hide-details="auto"
          v-model="note"
          :rules="[checkNotesLengthRule]"
          required
        />
      </template>
      <template #footer>
        <footer-buttons
          :processing="loading"
          primaryLabel="Trigger reassessment"
          @secondaryClick="cancel"
          @primaryClick="triggerReassessment"
        />
      </template>
    </modal-dialog-base>
  </v-form>
</template>
<script lang="ts">
import { VForm } from "@/types";
import { ref, defineComponent } from "vue";
import { useRules, useModalDialog } from "@/composables";
import { ManualReassessmentAPIInDTO } from "@/services/http/dto";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";

export default defineComponent({
  components: {
    ModalDialogBase,
  },
  setup() {
    const { showDialog, showModal, resolvePromise, loading } = useModalDialog<
      ManualReassessmentAPIInDTO | false
    >();
    const reassessmentForm = ref({} as VForm);
    const { checkNotesLengthRule } = useRules();
    const note = ref("");
    const cancel = () => {
      reassessmentForm.value.reset();
      resolvePromise(false);
    };
    const triggerReassessment = async () => {
      const validationResult = await reassessmentForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      resolvePromise({ note: note.value });
      reassessmentForm.value.reset();
    };
    return {
      showDialog,
      showModal,
      loading,
      reassessmentForm,
      triggerReassessment,
      cancel,
      checkNotesLengthRule,
      note,
    };
  },
});
</script>
