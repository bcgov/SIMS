<template>
  <modal-dialog-base
    title="Approve program"
    :showDialog="showDialog"
    @dialogClosed="dialogClosed"
  >
    <template v-slot:content>
      <formio
        formName="approveEducationProgram"
        @submitted="submitForm"
        @loaded="formLoaded"
      ></formio>
    </template>
    <template v-slot:footer>
      <footer-buttons
        primaryLabel="Approve now"
        @primaryClick="approveProgram"
        @secondaryClick="dialogClosed"
      />
    </template>
  </modal-dialog-base>
</template>

<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";
import { ApproveProgramAPIInDTO } from "@/services/http/dto";

export default {
  components: {
    ModalDialogBase,
  },
  setup() {
    const { showDialog, showModal, resolvePromise } = useModalDialog<
      ApproveProgramAPIInDTO | undefined
    >();
    let approveProgramForm: any = undefined;

    const approveProgram = () => {
      return approveProgramForm.submit();
    };
    const submitForm = (formData: ApproveProgramAPIInDTO) => {
      resolvePromise(formData);
    };

    const formLoaded = (form: any) => {
      approveProgramForm = form;
    };

    const dialogClosed = () => {
      resolvePromise(undefined);
    };

    return {
      showDialog,
      approveProgram,
      showModal,
      dialogClosed,
      formLoaded,
      submitForm,
    };
  },
};
</script>
