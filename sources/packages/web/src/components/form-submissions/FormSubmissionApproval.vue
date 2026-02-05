<template>
  <body-header-container :enable-card-view="false">
    <template #header>
      <body-header
        :title="formSubmission.formCategory"
        sub-title="Please see below the list of item(s) submitted."
      >
        <template #status-chip>
          <status-chip-form-submission :status="formSubmission.status" />
        </template>
      </body-header>
    </template>
    <v-form ref="approvalsForm">
      <error-summary :errors="approvalsForm.errors" />
      <form-submission-items
        :submission-items="formSubmissionItems"
        :read-only="true"
      >
        <template #approval-form="{ approval }">
          <span class="category-header-medium brand-gray-text">Decision</span>
          <v-divider />
          <v-textarea
            :ref="(el) => captureNoteRef(el, approval)"
            class="my-4"
            label="Notes"
            variant="outlined"
            v-model="approval.noteDescription"
            hide-details="auto"
            :rules="[
              (v) => checkNotesLengthRule(v, `${approval.parentName}, notes`),
            ]"
            required
            :disabled="readOnly"
          />
          <v-input
            v-model="approval.status"
            class="float-right"
            :rules="[
              (v: FormSubmissionDecisionStatus) =>
                hasDecisionRule(v, approval.parentName),
            ]"
            hide-details="auto"
          >
            <v-btn-toggle
              density="compact"
              v-model="approval.status"
              class="btn-toggle"
              selected-class="selected-btn-toggle"
              :disabled="readOnly"
              mandatory
              @update:model-value="onDecisionChange(approval)"
            >
              <v-btn
                color="warning"
                :value="FormSubmissionDecisionStatus.Pending"
                >{{ FormSubmissionDecisionStatus.Pending }}</v-btn
              >
              <v-btn
                color="primary"
                :value="FormSubmissionDecisionStatus.Approved"
                >{{ FormSubmissionDecisionStatus.Approved }}</v-btn
              >
              <v-btn
                color="danger"
                :value="FormSubmissionDecisionStatus.Declined"
                >{{ FormSubmissionDecisionStatus.Declined }}</v-btn
              >
            </v-btn-toggle>
          </v-input>
        </template>
      </form-submission-items>
    </v-form>
    <footer-buttons
      justify="space-between"
      :processing="processing"
      @secondary-click="$.emit('cancel')"
      secondary-label="Back"
      @primary-click="submit"
      primary-label="Submit final decision(s)"
    ></footer-buttons>
  </body-header-container>
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect } from "vue";
import {
  FormSubmissionItem,
  FormSubmissionItemApproval,
  FormSubmissionDecisionStatus,
  VForm,
} from "@/types";
import FormSubmissionItems from "./FormSubmissionItems.vue";
import { FormSubmissionsService } from "@/services/FormSubmissionsService";
import { useRules } from "@/composables";
import { VTextarea } from "vuetify/lib/components";
import { FormSubmissionMinistryAPIOutDTO } from "@/services/http/dto/FormSubmission.dto";
import StatusChipFormSubmission from "@/components/generic/StatusChipFormSubmission.vue";

export default defineComponent({
  components: {
    FormSubmissionItems,
    StatusChipFormSubmission,
  },
  props: {
    formSubmissionId: {
      type: Number,
      required: true,
    },
    readOnly: {
      type: Boolean,
      required: false,
      default: false,
    },
    showApprovalDetails: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  setup(props) {
    //const router = useRouter();
    //const snackBar = useSnackBar();
    const { checkNotesLengthRule } = useRules();
    const formSubmission = ref({} as FormSubmissionMinistryAPIOutDTO);
    const formSubmissionItems = ref([] as FormSubmissionItem[]);
    const processing = ref(false);
    const approvalsForm = ref({} as VForm);
    const noteRefs = ref(
      new Map<FormSubmissionItemApproval, InstanceType<typeof VTextarea>>(),
    );

    watchEffect(async () => {
      formSubmission.value =
        await FormSubmissionsService.shared.getFormSubmission(
          props.formSubmissionId,
        );
      formSubmissionItems.value =
        formSubmission.value.submissionItems.map<FormSubmissionItem>(
          (submissionItem) => ({
            dynamicConfigurationId: submissionItem.dynamicFormConfigurationId,
            formType: submissionItem.formType,
            category: formSubmission.value.formCategory,
            formName: submissionItem.formDefinitionName,
            formData: submissionItem.submissionData,
            approval: {
              parentName: submissionItem.formType,
              status: submissionItem.decisionStatus,
            } as FormSubmissionItemApproval,
            files: [],
          }),
        );
    });

    const submit = async () => {
      // TODO: validate form.
      const validationResult = await approvalsForm.value.validate();
      console.log(validationResult);
      if (!validationResult.valid) {
        return;
      }
    };

    const captureNoteRef = (
      el: unknown,
      approval: FormSubmissionItemApproval,
    ) => {
      if (el) {
        noteRefs.value.set(approval, el as InstanceType<typeof VTextarea>);
      }
    };

    const hasDecisionRule = (
      value: FormSubmissionDecisionStatus,
      parentName: string,
    ) => {
      if (value === FormSubmissionDecisionStatus.Pending) {
        return `${parentName}, pending decision.`;
      }
      return true;
    };

    /**
     * Triggered when the decision button toggle changes.
     * Finds the associated notes textarea and triggers validation.
     * @param approval the approval item that changed.
     */
    const onDecisionChange = async (approval: FormSubmissionItemApproval) => {
      const noteInput = noteRefs.value.get(approval);
      const errors = await noteInput?.validate();
      if (errors.length) {
        console.log("ERROR");
      } else {
        console.log("VALID");
      }
    };

    return {
      formSubmission,
      formSubmissionItems,
      processing,
      checkNotesLengthRule,
      hasDecisionRule,
      FormSubmissionDecisionStatus,
      submit,
      approvalsForm,
      captureNoteRef,
      onDecisionChange,
    };
  },
});
</script>
