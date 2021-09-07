<template>
  <ModalDialogBase
    title="Decline Confirmation of Enrolment"
    dialogType="question"
    :showDialog="showDialog"
    @dialogClosed="dialogClosed"
  >
    <template v-slot:content>
      <v-container>
        <formio
          formName="declineconfirmationofenrollment"
          @loaded="formLoaded"
          @submitted="submitApplication"
        ></formio>
      </v-container>
    </template>
    <template v-slot:footer>
      <v-btn color="primary" outlined @click="dialogClosed">
        Cancel
      </v-btn>
      <v-btn
        color="danger"
        depressed
        @click="denyProgramInfo"
        style="color:white"
      >
        <v-icon left size="25">
          mdi-cancel
        </v-icon>
        Decline Request
      </v-btn>
    </template>
  </ModalDialogBase>
</template>

<script lang="ts">
import { ref } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog, useFormioUtils } from "@/composables";
import formio from "@/components/generic/formio.vue";
import { ConfirmationOfEnrollmentService } from "@/services/ConfirmationOfEnrollmentService";
export const COE_DENIAL_REASON_RADIO = "coeDenyReasonId";

export default {
  components: {
    ModalDialogBase,
    formio,
  },
  emits: ["submitData"],
  setup(props: any, context: any) {
    const { showDialog, resolvePromise, showModal } = useModalDialog<boolean>();
    const formioUtils = useFormioUtils();
    const COEDenialform = ref();
    const submitForm = async () => {
      return await COEDenialform.value.submit();
    };
    const denyProgramInfo = async () => {
      const formSubmitted = await submitForm();
      if (formSubmitted) {
        showDialog.value = false;
        resolvePromise(true);
      }
    };

    const dialogClosed = () => {
      showDialog.value = false;
      resolvePromise(false);
    };

    const formLoaded = async (form: any) => {
      COEDenialform.value = form;
      formioUtils.setRadioOptions(
        form,
        COE_DENIAL_REASON_RADIO,
        await ConfirmationOfEnrollmentService.shared.getCOEDenialReasons(),
      );
    };

    const submitApplication = async (args: any) => {
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
