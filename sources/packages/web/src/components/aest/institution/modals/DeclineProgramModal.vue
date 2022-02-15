<template>
  <ModalDialogBase
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
      <v-btn outlined :color="COLOR_BLUE" @click="dialogClosed">
        Cancel
      </v-btn>
      <v-btn class="primary-btn-background" @click="declineProgram">
        Decline now
      </v-btn>
    </template>
  </ModalDialogBase>
</template>

<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";
import formio from "@/components/generic/formio.vue";
import { COLOR_BLUE } from "@/constants";
import { DeclineProgram } from "@/types";

export default {
  components: {
    ModalDialogBase,
    formio,
  },
  setup() {
    const { showDialog, resolvePromise, showModal } = useModalDialog<
      DeclineProgram
    >();
    let declineProgramForm: any = undefined;

    const declineProgram = () => {
      return declineProgramForm.submit();
    };
    const submitForm = (formData: DeclineProgram) => {
      showDialog.value = false;
      resolvePromise(formData);
    };

    const formLoaded = (form: any) => {
      declineProgramForm = form;
    };

    const dialogClosed = () => {
      showDialog.value = false;
    };

    return {
      showDialog,
      declineProgram,
      showModal,
      dialogClosed,
      COLOR_BLUE,
      formLoaded,
      submitForm,
    };
  },
};
</script>
