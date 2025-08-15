<template>
  <v-form ref="reverseScholasticStandingForm">
    <modal-dialog-base
      :showDialog="showDialog"
      title="Reverse scholastic standing"
    >
      <template #content>
        <error-summary :errors="reverseScholasticStandingForm.errors" />
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
          primaryLabel="Reverse"
          @secondaryClick="cancel"
          @primaryClick="reverseScholasticChange"
        />
      </template>
    </modal-dialog-base>
  </v-form>
</template>
<script lang="ts">
import { VForm } from "@/types";
import { ref, defineComponent } from "vue";
import { useRules, useModalDialog } from "@/composables";
import { ReverseScholasticStandingAPIInDTO } from "@/services/http/dto";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";

export default defineComponent({
  components: {
    ModalDialogBase,
    ErrorSummary,
  },
  setup() {
    const { showDialog, showModal, resolvePromise, loading } = useModalDialog<
      ReverseScholasticStandingAPIInDTO | false
    >();
    const reverseScholasticStandingForm = ref({} as VForm);
    const { checkNotesLengthRule } = useRules();
    const note = ref<string>("");
    const cancel = () => {
      reverseScholasticStandingForm.value.reset();
      resolvePromise(false);
    };
    const reverseScholasticChange = async () => {
      const validationResult =
        await reverseScholasticStandingForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      resolvePromise({ note: note.value });
      reverseScholasticStandingForm.value.reset();
    };
    return {
      showDialog,
      showModal,
      loading,
      reverseScholasticStandingForm,
      reverseScholasticChange,
      cancel,
      checkNotesLengthRule,
      note,
    };
  },
});
</script>
