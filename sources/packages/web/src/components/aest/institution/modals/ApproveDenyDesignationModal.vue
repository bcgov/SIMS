<template>
  <v-form ref="approveDenyDesignation">
    <modal-dialog-base :showDialog="showDialog" :title="title">
      <template #content>
        <error-summary :errors="approveDenyDesignation.errors" />
        <p class="label-value">{{ subTitle }}</p>
        <content-group class="my-3" v-if="showApprovalContent">
          <h4 class="label-bold color-blue">Effective dates</h4>
          <v-row
            ><v-col
              ><v-text-field
                label="Start date"
                class="mt-2"
                type="date"
                v-model="formModel.startDate"
                variant="outlined"
                :rules="[checkStringDateFormatRule]"
                hide-details="auto"
            /></v-col>
            <v-col
              ><v-text-field
                label="Expiry date"
                class="mt-2"
                type="date"
                v-model="formModel.endDate"
                variant="outlined"
                :rules="[checkStringDateFormatRule]"
                hide-details="auto" /></v-col></v-row
          ><v-divider-opaque />
          <h4 class="label-bold color-blue">Designate locations</h4>
          <v-row
            v-for="(item, index) in formModel.locationsDesignations"
            :key="index"
            ><v-col
              ><title-value
                :propertyTitle="item.locationName"
                :propertyValue="item.locationAddress" /></v-col
            ><v-col
              ><v-checkbox
                class="float-right"
                color="primary"
                v-model="item.approved"
                hide-details="auto" /></v-col
          ></v-row> </content-group
        ><v-textarea
          class="mt-4"
          label="Notes"
          placeholder="Long text..."
          v-model="formModel.note"
          variant="outlined"
          :rules="[checkNotesLengthRule]"
        />
      </template>
      <template #footer>
        <check-permission-role
          :role="Role.InstitutionApproveDeclineDesignation"
        >
          <template #="{ notAllowed }">
            <footer-buttons
              :processing="processing"
              :primaryLabel="submitLabel"
              @primaryClick="submit"
              @secondaryClick="cancel"
              :disablePrimaryButton="notAllowed" /></template
        ></check-permission-role>
      </template>
    </modal-dialog-base>
  </v-form>
</template>

<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import {
  UpdateDesignationDetailsAPIInDTO,
  DesignationAgreementStatus,
} from "@/services/http/dto";
import { useModalDialog, useRules } from "@/composables";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { Role, VForm } from "@/types";
import { ref, reactive, defineComponent } from "vue";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";
import TitleValue from "@/components/generic/TitleValue.vue";

export default defineComponent({
  components: {
    ModalDialogBase,
    CheckPermissionRole,
    ErrorSummary,
    TitleValue,
  },
  props: {
    processing: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  setup() {
    const {
      showDialog,
      resolvePromise,
      showModal: showModalInternal,
    } = useModalDialog<UpdateDesignationDetailsAPIInDTO | boolean>();
    const approveDenyDesignation = ref({} as VForm);
    const formModel = reactive({} as UpdateDesignationDetailsAPIInDTO);
    const title = ref("");
    const subTitle = ref("");
    const submitLabel = ref("");
    const showApprovalContent = ref(false);
    const { checkNotesLengthRule, checkStringDateFormatRule } = useRules();

    //Setting the title values based on the DesignationAgreementStatus status passed to show modal.
    const showModal = async (designation: UpdateDesignationDetailsAPIInDTO) => {
      formModel.note = "";
      formModel.designationStatus = designation.designationStatus;
      formModel.locationsDesignations = designation.locationsDesignations;

      if (
        designation.designationStatus === DesignationAgreementStatus.Approved
      ) {
        title.value = "Approve designation";
        subTitle.value =
          "Outline the reasoning for accepting this designation. The notes will be added to the institution profile.";
        submitLabel.value = "Approve designation now";
        showApprovalContent.value = true;
      } else {
        title.value = "Decline designation";
        subTitle.value =
          "Outline the reasoning for declining this designation. The notes will be added to the institution profile.";
        submitLabel.value = "Decline designation now";
        showApprovalContent.value = false;
      }

      return showModalInternal(designation);
    };

    const submit = async () => {
      const validationResult = await approveDenyDesignation.value.validate();
      if (!validationResult.valid) {
        return;
      }
      resolvePromise(formModel);
    };

    // Closed the modal dialog.
    const cancel = () => {
      approveDenyDesignation.value.reset();
      approveDenyDesignation.value.resetValidation();
      resolvePromise(false);
    };

    return {
      showDialog,
      showModal,
      cancel,
      submit,
      title,
      Role,
      subTitle,
      submitLabel,
      showApprovalContent,
      approveDenyDesignation,
      checkStringDateFormatRule,
      checkNotesLengthRule,
      formModel,
    };
  },
});
</script>
