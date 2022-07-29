<template>
  <modal-dialog-base
    title="Decline program"
    :showDialog="showDialog"
    @dialogClosed="dialogClosed"
  >
    <template v-slot:content>
      <formio
        formName="declineEducationProgram"
        @submitted="submitForm"
        @loaded="formLoaded"
      ></formio>
    </template>
    <template v-slot:footer>
      <footer-buttons
        primaryLabel="Decline now"
        @primaryClick="declineProgram"
        @secondaryClick="dialogClosed"
      />
    </template>
  </modal-dialog-base>
</template>

<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";
import { DeclineProgram } from "@/types";

export default {
  components: {
    ModalDialogBase,
  },
  setup() {
    const { showDialog, resolvePromise, showModal } = useModalDialog<
      DeclineProgram | undefined
    >();
    let declineProgramForm: any = undefined;

    const declineProgram = () => {
      return declineProgramForm.submit();
    };
    const submitForm = (formData: DeclineProgram) => {
      resolvePromise(formData);
    };

    const formLoaded = (form: any) => {
      declineProgramForm = form;
    };

    const dialogClosed = () => {
      resolvePromise(undefined);
    };

    return {
      showDialog,
      declineProgram,
      showModal,
      dialogClosed,
      formLoaded,
      submitForm,
    };
  },
};
</script>
