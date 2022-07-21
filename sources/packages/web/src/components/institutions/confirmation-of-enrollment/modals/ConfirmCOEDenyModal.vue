<template>
  <modal-dialog-base
    title="Decline Confirmation of Enrolment"
    dialogType="question"
    :showDialog="showDialog"
    @dialogClosed="dialogClosed"
  >
    <template v-slot:content>
      <v-container>
        <formio
          formName="declineConfirmationOfEnrollment"
          @loaded="formLoaded"
          @submitted="submitApplication"
        ></formio>
      </v-container>
    </template>
    <template v-slot:footer>
      <footer-buttons
        primaryLabel="Decline Request"
        @primaryClick="denyProgramInfo"
        @secondaryClick="dialogClosed"
      />
    </template>
  </modal-dialog-base>
</template>

<script lang="ts">
import { ref } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog, useFormioUtils } from "@/composables";
import { ConfirmationOfEnrollmentService } from "@/services/ConfirmationOfEnrollmentService";
import { DenyConfirmationOfEnrollmentAPIInDTO } from "@/services/http/dto";

const COE_DENIAL_REASON_RADIO = "coeDenyReasonId";

export default {
  components: {
    ModalDialogBase,
  },
  emits: ["submitData"],
  setup(_props: any, context: any) {
    const { showDialog, showModal } = useModalDialog<void>();
    const formioUtils = useFormioUtils();
    const COEDenialform = ref();
    const submitForm = async () => {
      return COEDenialform.value.submit();
    };
    const denyProgramInfo = async () => {
      const formSubmitted = await submitForm();
      if (formSubmitted) {
        showDialog.value = false;
      }
    };

    const dialogClosed = () => {
      showDialog.value = false;
    };

    const formLoaded = async (form: any) => {
      COEDenialform.value = form;
      formioUtils.setRadioOptions(
        form,
        COE_DENIAL_REASON_RADIO,
        await ConfirmationOfEnrollmentService.shared.getCOEDenialReasons(),
      );
    };

    const submitApplication = async (
      args: DenyConfirmationOfEnrollmentAPIInDTO,
    ) => {
      context.emit("submitData", args);
    };
    return {
      showDialog,
      denyProgramInfo,
      showModal,
      dialogClosed,
      formLoaded,
      submitApplication,
    };
  },
};
</script>
