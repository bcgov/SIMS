<template>
  <ModalDialogBase
    title="Approve program"
    :showDialog="showDialog"
    @dialogClosed="dialogClosed"
  >
    <template v-slot:content>
      <formio
        formName="approveEducationProgram"
        @submitted="approveProgram"
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

export default {
  components: {
    ModalDialogBase,
    formio,
  },
  setup() {
    const { showDialog, resolvePromise, showModal } = useModalDialog<boolean>();
    const approveProgramform = ref();

    const submitForm = async () => {
      return approveProgramform.value.submit();
    };
    const approveProgram = async () => {
      const formSubmitted = await submitForm();
      if (formSubmitted) {
        showDialog.value = false;
        resolvePromise(true);
      }
    };

    const formLoaded = async (form: any) => {
      approveProgramform.value = form;
    };

    const dialogClosed = () => {
      showDialog.value = false;
      resolvePromise(false);
    };

    return {
      showDialog,
      approveProgram,
      showModal,
      dialogClosed,
      COLOR_BLUE,
      formLoaded,
    };
  },
};
</script>
