<template>
  <modal-dialog-base
    :showDialog="showDialog"
    @dialogClosed="dialogClosed"
    :title="title"
    :subTitle="subTitle"
  >
    <template v-slot:content>
      <div class="mt-2">
        <v-form ref="offeringChangeApprovalForm">
          <v-textarea
            v-model="assessOfferingData.assessmentNotes"
            variant="outlined"
            label="Notes"
            :rules="[(v) => !!v || 'Notes is required']"
            required
          ></v-textarea>
        </v-form>
      </div>
    </template>
    <template v-slot:footer>
      <footer-buttons
        :primaryLabel="submitLabel"
        @primaryClick="submitForm"
        @secondaryClick="dialogClosed"
      />
    </template>
  </modal-dialog-base>
</template>

<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";
import { ref, reactive } from "vue";
import { OfferingStatus, VForm } from "@/types";
import { OfferingChangeAssessmentAPIInDTO } from "@/services/http/dto";

export default {
  components: { ModalDialogBase },
  setup() {
    const {
      showDialog,
      showModal: showModalInternal,
      resolvePromise,
    } = useModalDialog<OfferingChangeAssessmentAPIInDTO | boolean>();
    const offeringChangeApprovalForm = ref({} as VForm);
    const assessOfferingData = reactive({} as OfferingChangeAssessmentAPIInDTO);
    const title = ref("");
    const subTitle = ref("");
    const submitLabel = ref("");

    const dialogClosed = () => {
      resolvePromise(false);
    };

    //Setting the title values based on the offering status passed to show modal.
    const showModal = async (modalOfferingStatus: OfferingStatus) => {
      //TODO: Resetting the form value manually as $ref.form.reset() is not working.
      assessOfferingData.assessmentNotes = "";
      assessOfferingData.offeringStatus = modalOfferingStatus;
      switch (modalOfferingStatus) {
        case OfferingStatus.Approved:
          title.value = "Approve for reassessment";
          subTitle.value =
            "Outline the reasoning for approving this request. This will be stored in the institution profile notes.";
          submitLabel.value = "Approve now";
          break;
        default:
          title.value = "Decline for reassessment";
          subTitle.value =
            "Outline the reasoning for declining this request. This will be stored in the institution profile notes.";
          submitLabel.value = "Decline now";
      }
      return showModalInternal(modalOfferingStatus);
    };

    const submitForm = async () => {
      const formValidationStatus =
        await offeringChangeApprovalForm.value.validate();
      if (formValidationStatus.valid) {
        resolvePromise(assessOfferingData);
      }
    };

    return {
      showDialog,
      showModal,
      dialogClosed,
      submitForm,
      title,
      offeringChangeApprovalForm,
      assessOfferingData,
      subTitle,
      submitLabel,
    };
  },
};
</script>
