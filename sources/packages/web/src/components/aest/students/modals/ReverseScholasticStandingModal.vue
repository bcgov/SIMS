<template>
  <v-form ref="reverseScholasticStandingForm">
    <modal-dialog-base
      :showDialog="showDialog"
      title="Reverse scholastic standing"
    >
      <template #content>
        <error-summary :errors="reverseScholasticStandingForm.errors" />
        <div class="pt-2">
          <p>
            <strong>Attention:</strong> You are about to reverse a scholastic
            standing event associated with this application. Please be advised
            that this action is final and cannot be undone.
          </p>
          <p>
            <strong>Important Reminder:</strong> If a pending disbursement was
            previously canceled as a result of the scholastic standing
            reporting, a new Confirmation of Enrollment must be submitted before
            the funds can be released. Additionally, please ensure that any
            related restrictions on the student's account are reviewed and
            manually reversed, if applicable.
          </p>
        </div>
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
