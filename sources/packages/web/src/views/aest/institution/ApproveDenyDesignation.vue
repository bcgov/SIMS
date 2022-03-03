<template>
  <!-- CSS class temporary-modal is work around for lack of responsiveness of v-dialog. -->
  <ModalDialogBase :showDialog="showDialog" @dialogClosed="dialogClosed">
    <template v-slot:content>
      <v-container class="temporary-modal">
        <formio
          formName="approvedenydesignation"
          :data="designation"
          @loaded="formLoaded"
          @submitted="submitDesignationUpdate"
        ></formio>
      </v-container>
    </template>
    <template v-slot:footer>
      <v-btn color="primary" outlined @click="dialogClosed"> Cancel </v-btn>
      <v-btn
        @click="submitDesignation()"
        class="float-right primary-btn-background"
      >
        Submit Action
      </v-btn>
    </template>
  </ModalDialogBase>
</template>

<script lang="ts">
import { ref } from "vue";
import formio from "@/components/generic/formio.vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { UpdateDesignationDto } from "@/types/contracts/DesignationAgreementContract";
import { useModalDialog } from "@/composables";
export default {
  components: { ModalDialogBase, formio },
  props: {
    designation: {
      type: Object,
      required: true,
    },
  },
  setup() {
    const { showDialog, showModal, resolvePromise } = useModalDialog<
      UpdateDesignationDto | boolean
    >();
    const formData = ref();

    const dialogClosed = () => {
      showDialog.value = false;
      resolvePromise(false);
    };

    const formLoaded = async (form: any) => {
      formData.value = form;
    };

    const submitDesignationUpdate = async (data: UpdateDesignationDto) => {
      showDialog.value = false;
      resolvePromise(data);
    };
    const submitDesignation = async () => {
      return formData.value.submit();
    };

    return {
      showDialog,
      showModal,
      dialogClosed,
      formLoaded,
      submitDesignationUpdate,
      submitDesignation,
    };
  },
};
</script>
