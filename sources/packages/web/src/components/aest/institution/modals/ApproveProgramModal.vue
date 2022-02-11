<template>
  <ModalDialogBase
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
      <v-btn outlined :color="COLOR_BLUE" @click="dialogClosed">
        Cancel
      </v-btn>
      <v-btn class="primary-btn-background" @click="approveProgram">
        Approve now
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
import { ApproveProgram } from "@/types";

export default {
  components: {
    ModalDialogBase,
    formio,
  },
  emits: ["submitData"],
  setup(props: any, context: any) {
    const { showDialog, showModal } = useModalDialog<void>();
    const approveProgramform = ref();

    const approveProgram = async () => {
      return approveProgramform.value.submit();
    };
    const submitForm = async (formData: ApproveProgram) => {
      showDialog.value = false;
      context.emit("submitData", formData);
    };

    const formLoaded = async (form: any) => {
      approveProgramform.value = form;
    };

    const dialogClosed = () => {
      showDialog.value = false;
    };

    return {
      showDialog,
      approveProgram,
      showModal,
      dialogClosed,
      COLOR_BLUE,
      formLoaded,
      submitForm,
    };
  },
};
</script>
