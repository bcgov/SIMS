<template>
  <v-form ref="assessOfferingForm">
    <modal-dialog-base :showDialog="showDialog" :title="title" max-width="730">
      <template #content>
        <error-summary :errors="assessOfferingForm.errors" />
        <div class="pb-2">
          <span class="label-value">{{ label }}</span>
        </div>
        <v-textarea
          label="Notes"
          placeholder="Long text..."
          v-model="formModel.assessmentNotes"
          variant="outlined"
          :rules="[(v) => checkNotesLength(v)]"
        />
      </template>
      <template #footer>
        <check-permission-role :role="Role.InstitutionApproveDeclineOffering">
          <template #="{ notAllowed }">
            <footer-buttons
              :processing="processing"
              :primaryLabel="primaryLabel"
              @primaryClick="submit"
              @secondaryClick="cancel"
              :disablePrimaryButton="notAllowed"
          /></template>
        </check-permission-role>
      </template>
    </modal-dialog-base>
  </v-form>
</template>

<script lang="ts">
import { ref, reactive, computed } from "vue";
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import { useModalDialog, useValidators } from "@/composables";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";
import { OfferingStatus, Role, VForm } from "@/types";
import { OfferingAssessmentAPIInDTO } from "@/services/http/dto";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";

export default {
  components: { ModalDialogBase, CheckPermissionRole, ErrorSummary },
  props: {
    offeringStatus: {
      type: String,
      required: true,
    },
    processing: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  setup(props: any) {
    const NOTES_MAX_CHARACTERS = 500;
    const { checkMaxCharacters } = useValidators();
    const { showDialog, showModal, resolvePromise } = useModalDialog<
      OfferingAssessmentAPIInDTO | boolean
    >();

    const assessOfferingForm = ref({} as VForm);
    const formModel = reactive({
      assessmentNotes: "",
    } as OfferingAssessmentAPIInDTO);

    const title = computed(() =>
      props.offeringStatus === OfferingStatus.Approved
        ? "Approve Offering"
        : "Decline Offering",
    );

    const label = computed(() =>
      props.offeringStatus === OfferingStatus.Approved
        ? "Outline the reasoning for approving this request. This will be stored in the institution profile notes."
        : "Outline the reasoning for declining this request. This will be stored in the institution profile notes.",
    );

    const primaryLabel = computed(() =>
      props.offeringStatus === OfferingStatus.Approved
        ? "Approve now"
        : "Decline now",
    );

    const cancel = () => {
      assessOfferingForm.value.reset();
      assessOfferingForm.value.resetValidation();
      resolvePromise(false);
    };

    const submit = async () => {
      const validationResult = await assessOfferingForm.value.validate();
      if (!validationResult.valid) {
        return;
      }
      formModel.offeringStatus = props.offeringStatus;
      resolvePromise(formModel);
    };

    const checkNotesLength = (notes: string) => {
      if (notes) {
        return (
          checkMaxCharacters(notes, NOTES_MAX_CHARACTERS) ||
          `Max ${NOTES_MAX_CHARACTERS} characters.`
        );
      }
      return "Note body is required.";
    };

    return {
      showDialog,
      showModal,
      cancel,
      submit,
      label,
      title,
      primaryLabel,
      Role,
      assessOfferingForm,
      formModel,
      checkNotesLength,
    };
  },
};
</script>
