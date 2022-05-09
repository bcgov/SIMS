<template>
  <ModalDialogBase
    :showDialog="showDialog"
    @dialogClosed="dialogClosed"
    :title="title"
  >
    <template v-slot:content>
      <div class="mt-2">
        <formio
          formName="approvedeclineoffering"
          :data="{ offeringStatus }"
          @loaded="formLoaded"
          @submitted="submitOfferingAssessment"
        ></formio>
      </div>
    </template>
    <template v-slot:footer>
      <v-btn color="primary" variant="outlined" @click="dialogClosed">
        Cancel
      </v-btn>
      <v-btn @click="submitForm()" class="float-right primary-btn-background">
        Submit Action
      </v-btn>
    </template>
  </ModalDialogBase>
</template>

<script lang="ts">
import formio from "@/components/generic/formio.vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";
import { computed } from "vue";
import { OfferingStatus } from "@/types";
import { OfferingAssessmentAPIInDTO } from "@/services/http/dto";
export default {
  components: { ModalDialogBase, formio },
  props: {
    offeringStatus: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const { showDialog, showModal, resolvePromise } = useModalDialog<
      OfferingAssessmentAPIInDTO | boolean
    >();
    let formData: any = undefined;

    const title = computed(() =>
      props.offeringStatus === OfferingStatus.Approved
        ? "Approve Offering"
        : "Decline Offering",
    );

    const dialogClosed = () => {
      resolvePromise(false);
    };

    const formLoaded = (form: any) => {
      formData = form;
    };

    const submitOfferingAssessment = (data: OfferingAssessmentAPIInDTO) => {
      resolvePromise(data);
    };

    // method to be called from submit button in vue modal
    const submitForm = () => {
      return formData.submit();
    };

    return {
      showDialog,
      showModal,
      dialogClosed,
      formLoaded,
      submitOfferingAssessment,
      submitForm,
      title,
    };
  },
};
</script>
