<template>
  <v-form ref="denyCOE">
    <modal-dialog-base :show-dialog="showDialog" title="Decline enrolment">
      <template #content>
        <error-summary :errors="denyCOE.errors" />
        <div class="pb-2">
          <span class="label-value"
            >Declining this request will stop this application from moving
            forward. If you would like to continue, please select the reason
            below.</span
          ><span class="label-bold">
            Your denial reason will be visible to the applicant.</span
          >
        </div>
        <v-radio-group
          v-model="formModel.coeDenyReasonId"
          class="mt-2 input-unset-display-opacity"
          color="primary"
          :rules="[
            (v) =>
              !!v ||
              'Select the reason for declining the enrolment is required.',
          ]"
          ><template #label>
            <div class="label-bold-normal">
              Select the reason for declining the enrolment
            </div>
          </template>
          <v-radio
            v-for="reason in COEDenialReasons"
            :key="reason.value"
            :label="reason.label"
            :value="reason.value"
            class="mt-2"
            hide-details
          ></v-radio>
        </v-radio-group>
        <!-- The value of other is 1, so we are showing the Other Reason, when the Institution user selects Other.-->
        <v-textarea
          v-if="formModel.coeDenyReasonId === 1"
          label="Other reason"
          v-model="formModel.otherReasonDesc"
          variant="outlined"
          :rules="[(v) => !!v || 'Other reason is required.']"
        />
      </template>
      <template #footer>
        <footer-buttons
          primary-label="Decline enrolment now"
          @primary-click="submit"
          @secondary-click="cancel"
        />
      </template>
    </modal-dialog-base>
  </v-form>
</template>

<script lang="ts">
import { ref, reactive, defineComponent, PropType, watchEffect } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { OfferingIntensity, VForm } from "@/types";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";
import { useModalDialog } from "@/composables";
import {
  COEDeniedReasonAPIOutDTO,
  DenyConfirmationOfEnrollmentAPIInDTO,
} from "@/services/http/dto";
import { ConfirmationOfEnrollmentService } from "@/services/ConfirmationOfEnrollmentService";

export default defineComponent({
  components: {
    ModalDialogBase,
    ErrorSummary,
  },
  props: {
    offeringIntensity: {
      type: String as PropType<OfferingIntensity>,
      required: false,
      default: undefined,
    },
  },
  setup(props) {
    const COEDenialReasons = ref([] as COEDeniedReasonAPIOutDTO[]);
    const { showDialog, resolvePromise, showModal } = useModalDialog<
      DenyConfirmationOfEnrollmentAPIInDTO | boolean
    >();
    const denyCOE = ref({} as VForm);
    const formModel = reactive({} as DenyConfirmationOfEnrollmentAPIInDTO);

    // Deny COE and closes the modal.
    const submit = async () => {
      const validationResult = await denyCOE.value.validate();
      if (!validationResult.valid) {
        return;
      }
      resolvePromise(formModel);
    };

    // Closed the modal dialog.
    const cancel = () => {
      denyCOE.value.reset();
      denyCOE.value.resetValidation();
      resolvePromise(false);
    };

    watchEffect(async () => {
      if (!props.offeringIntensity) {
        COEDenialReasons.value = [];
        return;
      }
      COEDenialReasons.value =
        await ConfirmationOfEnrollmentService.shared.getCOEDenialReasons(
          props.offeringIntensity,
        );
    });

    return {
      denyCOE,
      showDialog,
      submit,
      cancel,
      formModel,
      showModal,
      COEDenialReasons,
    };
  },
});
</script>
