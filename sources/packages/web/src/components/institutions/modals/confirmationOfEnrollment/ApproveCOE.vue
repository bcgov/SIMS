<template>
  <v-form ref="confirmCOE">
    <modal-dialog-base :show-dialog="showDialog" title="Confirm enrolment">
      <template #content>
        <error-summary :errors="confirmCOE.errors" />
        <p class="category-header-medium">
          Do you want to confirm enrolment for this application?
        </p>
        <span class="label-value"
          >Confirming enrolment verifies this applicant is attending your
          institution and will allow funding to be disbursed.</span
        >
        <content-group class="my-3" v-if="canRequestTuitionRemittance">
          <v-radio-group
            v-model="formModel.requestedTuitionRemittance"
            class="mt-2 input-unset-display-opacity"
            color="primary"
            hide-details="auto"
            :rules="[
              (v) =>
                !!(v === true || v === false) ||
                'Do you want to request tuition remittance is required.',
            ]"
            ><template #label>
              <div class="label-bold-normal">
                Do you want to request tuition remittance?
              </div>
            </template>
            <v-radio label="Yes" :value="true"></v-radio>
            <v-radio label="No" :value="false"></v-radio>
          </v-radio-group>
          <template v-if="!!formModel.requestedTuitionRemittance">
            <content-group>
              <v-text-field
                class="my-2"
                label="Tuition remittance amount"
                v-model="formModel.tuitionRemittanceAmount"
                variant="outlined"
                type="number"
                prefix="$"
                hide-details="auto"
                :rules="[
                  (v) => checkNullOrEmptyRule(v, 'Tuition remittance'),
                  (v) =>
                    numberRangeRule(
                      v,
                      1,
                      maxTuitionRemittance,
                      'Tuition remittance',
                      formatCurrency,
                    ),
                ]"
              />
              <div>
                <span>Maximum tuition amount: </span>
                <span class="label-bold">{{
                  formatCurrency(maxTuitionRemittance)
                }}</span>
                <tooltip-icon
                  >This is the maximum amount you can request for this
                  application.</tooltip-icon
                >
              </div>
              <banner
                v-if="hasOverawards"
                class="mt-4"
                :type="BannerTypes.Warning"
                summary="The student has some overaward balance that can impact the tuition remittance requested at disbursement time."
              />
            </content-group>
          </template>
        </content-group>
      </template>
      <template #footer>
        <footer-buttons
          primary-label="Continue to confirmation"
          @primary-click="submit"
          @secondary-click="cancel"
        />
      </template>
    </modal-dialog-base>
  </v-form>
</template>

<script lang="ts">
import { ref, reactive, defineComponent } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { ApproveConfirmEnrollmentModel, VForm } from "@/types";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";
import { useFormatters, useModalDialog, useRules } from "@/composables";
import { BannerTypes } from "@/types/contracts/Banner";

export default defineComponent({
  components: {
    ModalDialogBase,
    ErrorSummary,
  },
  props: {
    hasOverawards: {
      type: Boolean,
      required: true,
    },
    maxTuitionRemittance: {
      type: Number,
      required: true,
    },
    canRequestTuitionRemittance: {
      type: Boolean,
      required: true,
    },
  },
  setup() {
    const { formatCurrency } = useFormatters();
    const { numberRangeRule, checkNullOrEmptyRule } = useRules();
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
      confirmCOE.value.resetValidation();
      resolvePromise(false);
      formModel.tuitionRemittanceAmount = 0;
    };

    return {
      confirmCOE,
      showDialog,
      submit,
      cancel,
      formModel,
      showModal,
      BannerTypes,
      formatCurrency,
      numberRangeRule,
      checkNullOrEmptyRule,
    };
  },
});
</script>
