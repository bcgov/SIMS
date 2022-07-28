<template>
  <modal-dialog-base
    :showDialog="showDialog"
    @dialogClosed="dialogClosed"
    :title="title"
    :subTitle="subTitle"
  >
    <template v-slot:content>
      <div class="mt-2">
        <v-form ref="offeringChangeApprovalForm" v-model="isFormValid">
          <v-textarea
            v-model="assessmentNotes"
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
        primaryLabel="Submit Action"
        @primaryClick="submitForm"
        @secondaryClick="dialogClosed"
      />
    </template>
  </modal-dialog-base>
</template>

<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog } from "@/composables";
import { computed, ref } from "vue";
import { OfferingStatus } from "@/types";
import { OfferingAssessmentAPIInDTO } from "@/services/http/dto";
export default {
  components: { ModalDialogBase },
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
    const offeringChangeApprovalForm = ref();
    const assessmentNotes = ref();

    const title = computed(() =>
      props.offeringStatus === OfferingStatus.Approved
        ? "Approve for reassessment"
        : "Decline for reassessment",
    );

    const subTitle = computed(() =>
      props.offeringStatus === OfferingStatus.Approved
        ? "Outline the reasoning for approving this request. This will be stored in the institution profile notes."
        : "Outline the reasoning for declining this request. This will be stored in the institution profile notes.",
    );

    const dialogClosed = () => {
      assessmentNotes.value = "";
      resolvePromise(false);
    };

    const submitForm = async () => {
      const formValidationStatus =
        await offeringChangeApprovalForm.value.validate();
      if (formValidationStatus.valid) {
        resolvePromise({
          offeringStatus: props.offeringStatus,
          assessmentNotes: assessmentNotes.value,
        });
      }
    };

    return {
      showDialog,
      showModal,
      dialogClosed,
      submitForm,
      title,
      offeringChangeApprovalForm,
      assessmentNotes,
      subTitle,
    };
  },
};
</script>
