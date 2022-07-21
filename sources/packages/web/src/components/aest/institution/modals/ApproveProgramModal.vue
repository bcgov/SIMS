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
      <v-row>
        <v-col>
          <v-btn variant="outlined" :color="COLOR_BLUE" @click="dialogClosed">
            Cancel
          </v-btn>
        </v-col>
        <v-col>
          <v-btn class="primary-btn-background" @click="approveProgram">
            Approve now
          </v-btn>
        </v-col>
      </v-row>
    </template>
  </ModalDialogBase>
</template>

<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";
import { COLOR_BLUE } from "@/constants";
import { ApproveProgram } from "@/types";

export default {
  components: {
    ModalDialogBase,
  },
  setup() {
    const { showDialog, showModal, resolvePromise } = useModalDialog<
      ApproveProgram | undefined
    >();
    let approveProgramForm: any = undefined;

    const approveProgram = () => {
      return approveProgramForm.submit();
    };
    const submitForm = (formData: ApproveProgram) => {
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
      COLOR_BLUE,
      formLoaded,
      submitForm,
    };
  },
};
</script>
