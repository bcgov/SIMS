<template>
  <v-form ref="confirmCOE">
    <modal-dialog-base
      :showDialog="showDialog"
      @dialogClosed="dialogClosed"
      title="Confirm enrolment"
      max-width="730"
    >
      <template #content>
        <error-summary :errors="confirmCOE.errors" />
        <p class="category-header-medium">
          Do you want to confirm this application?
        </p>
        <span class="label-value"
          >Confirming enrolment verifies this applicant is attending your
          institution and will allow funding to be disbursed.</span
        >
        <content-group class="my-3">
          <v-radio-group
            v-model="formModel.requestedTuitionRemittance"
            class="mt-2 input-unset-display-opacity"
            color="primary"
            :rules="[
              (v) =>
                !!(v === true || v === false) ||
                'Do you want to request tuition remittance is required',
            ]"
            ><template #label>
              <div class="label-bold-normal">
                Do you want to request tuition remittance?
              </div>
            </template>
            <v-radio label="Yes" :value="true"></v-radio>
            <v-radio label="No" :value="false"></v-radio>
          </v-radio-group>
          <content-group
            class="my-3"
            v-if="!!formModel.requestedTuitionRemittance"
          >
            <v-text-field
              label="Tuition remittance amount"
              v-model="formModel.tuitionRemittanceAmount"
              variant="outlined"
              type="number"
              prefix="$"
              :rules="[
                (v) =>
                  v > 0 || v === 0 || 'Tuition remittance amount is required',
              ]" /></content-group
        ></content-group>
      </template>
      <template #footer>
        <footer-buttons
          :processing="processing"
          primaryLabel="Continue to confirmation"
          @primaryClick="submit"
          @secondaryClick="cancel"
          :disablePrimaryButton="notAllowed"
        />
      </template>
    </modal-dialog-base>
  </v-form>
</template>

<script lang="ts">
import { ref, reactive } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { ApproveConfirmEnrollmentModel, VForm } from "@/types";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";
import { useModalDialog } from "@/composables";

export default {
  components: {
    ModalDialogBase,
    ErrorSummary,
  },
  setup() {
    const { showDialog, resolvePromise, showModal } = useModalDialog<
      ApproveConfirmEnrollmentModel | boolean
    >();
    const confirmCOE = ref({} as VForm);
    const formModel = reactive({
      tuitionRemittanceAmount: 0,
    } as ApproveConfirmEnrollmentModel);

    // Approve COE and closes the modal.
    const submit = async () => {
      const validationResult = await confirmCOE.value.validate();
      if (!validationResult.valid) {
        return;
      }
      resolvePromise(formModel);
    };

    // Closed the modal dialog.
    const cancel = () => {
      confirmCOE.value.reset();
      resolvePromise(false);
      formModel.tuitionRemittanceAmount = 0;
      confirmCOE.value.errors = [];
    };

    return {
      confirmCOE,
      showDialog,
      submit,
      cancel,
      formModel,
      showModal,
    };
  },
};
</script>
