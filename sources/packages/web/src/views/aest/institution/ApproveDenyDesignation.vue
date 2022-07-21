<template>
  <!-- CSS class temporary-modal is work around for lack of responsiveness of v-dialog. -->
  <ModalDialogBase
    :showDialog="showDialog"
    @dialogClosed="dialogClosed"
    :title="title"
  >
    <template v-slot:content>
      <div class="temporary-modal">
        <formio
          formName="approvedenydesignation"
          :data="designation"
          @loaded="formLoaded"
          @submitted="submitDesignationUpdate"
        ></formio>
      </div>
    </template>
    <template v-slot:footer>
      <v-row class="m-0 p-0">
        <v-btn color="primary" variant="outlined" @click="dialogClosed">
          Cancel
        </v-btn>
        <v-btn
          @click="submitDesignation()"
          class="float-right primary-btn-background"
        >
          Submit Action
        </v-btn>
      </v-row>
    </template>
  </ModalDialogBase>
</template>

<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import {
  UpdateDesignationDto,
  DesignationAgreementStatus,
} from "@/types/contracts/DesignationAgreementContract";
import { useModalDialog } from "@/composables";
import { computed } from "vue";
export default {
  components: { ModalDialogBase },
  props: {
    designation: {
      type: Object,
      required: true,
    },
  },
  setup(props: any) {
    const { showDialog, showModal, resolvePromise } = useModalDialog<
      UpdateDesignationDto | boolean
    >();
    let formData: any = undefined;

    const title = computed(() =>
      props.designation.designationStatus ===
      DesignationAgreementStatus.Approved
        ? "Approve Designation"
        : "Decline Designation",
    );

    const dialogClosed = () => {
      resolvePromise(false);
    };

    const formLoaded = (form: any) => {
      formData = form;
    };

    const submitDesignationUpdate = async (data: UpdateDesignationDto) => {
      resolvePromise(data);
    };
    const submitDesignation = async () => {
      return formData.submit();
    };

    return {
      showDialog,
      showModal,
      dialogClosed,
      formLoaded,
      submitDesignationUpdate,
      submitDesignation,
      title,
    };
  },
};
</script>
