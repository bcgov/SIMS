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
import { ref } from "vue";
import { DeclineProgram } from "@/types";

export default {
  components: {
    ModalDialogBase,
    formio,
  },
  emits: ["submitData"],
  setup(props: any, context: any) {
    const { showDialog, showModal } = useModalDialog<void>();
    const declineProgramform = ref();

    const declineProgram = async () => {
      return declineProgramform.value.submit();
    };
    const submitForm = async (formData: DeclineProgram) => {
      showDialog.value = false;
      context.emit("submitData", formData);
    };

    const formLoaded = async (form: any) => {
      declineProgramform.value = form;
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
