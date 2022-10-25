<template>
  <v-form ref="approveDenyDesignation">
    <modal-dialog-base :showDialog="showDialog" :title="title" max-width="730">
      <template #content>
        <error-summary :errors="approveDenyDesignation.errors" />
        <span class="label-value">{{ subTitle }} </span>
        <content-group class="my-3" v-if="showApprovalContent">
          <span class="label-bold color-blue">Effective dates</span>
          <v-row
            ><v-col
              ><v-text-field
                label="Start date"
                class="mt-2"
                type="date"
                placeholder="yyyy-MM-dd"
                v-model="formModel.startDate"
                variant="outlined"
                :rules="[checkStringDateFormatRule]"
            /></v-col>
            <v-col
              ><v-text-field
                label="Expiry date"
                class="mt-2"
                type="date"
                placeholder="yyyy-MM-dd"
                v-model="formModel.endDate"
                variant="outlined"
                :rules="[checkStringDateFormatRule]" /></v-col></v-row
          ><v-divider></v-divider
          ><span class="label-bold color-blue">Designate locations</span
          ><template
            v-for="(item, index) in formModel.locationsDesignations"
            :key="index"
          >
            <v-list-item :value="index" class="mt-2 ml-n4">
              <v-list-item-title>
                <v-row
                  ><v-col
                    ><p>
                      <span class="label-bold">{{ item.locationName }}</span>
                    </p>
                    <span>{{ item.locationAddress }}</span></v-col
                  ><v-col
                    ><v-checkbox
                      class="float-right"
                      v-model="item.approved"
                      hide-details="auto" /></v-col
                ></v-row>
              </v-list-item-title>
            </v-list-item> </template></content-group
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
          <footer-buttons
            :processing="processing"
            :primaryLabel="submitLabel"
            @primaryClick="submit"
            @secondaryClick="cancel"
        /></check-permission-role>
      </template>
    </modal-dialog-base>
  </v-form>
</template>

<script lang="ts">
import ModalDialogBase from "@/components/generic/ModalDialogBase.vue";
import {
  UpdateDesignationDto,
  DesignationAgreementStatus,
} from "@/types/contracts/DesignationAgreementContract";
import { useModalDialog, useRules } from "@/composables";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { Role, VForm } from "@/types";
import { ref, reactive } from "vue";
import ErrorSummary from "@/components/generic/ErrorSummary.vue";

export default {
  components: { ModalDialogBase, CheckPermissionRole, ErrorSummary },
  setup() {
    const {
      showDialog,
      resolvePromise,
      showModal: showModalInternal,
    } = useModalDialog<UpdateDesignationDto | boolean>();
    const approveDenyDesignation = ref({} as VForm);
    const formModel = reactive({} as UpdateDesignationDto);
    const title = ref("");
    const subTitle = ref("");
    const submitLabel = ref("");
    const showApprovalContent = ref(false);
    const { checkNotesLengthRule, checkStringDateFormatRule } = useRules();

    //Setting the title values based on the DesignationAgreementStatus status passed to show modal.
    const showModal = async (designation: UpdateDesignationDto) => {
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
};
</script>
