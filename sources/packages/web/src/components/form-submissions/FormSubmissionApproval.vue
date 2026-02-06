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
            :readonly="approval.decisionSaved"
            :disabled="readOnly || approval.saveDecisionInProgress"
          />

          <v-row justify="space-between" class="mt-2 mb-1 mx-0">
            <v-input
              v-model="approval.status"
              :rules="[
                (v: FormSubmissionDecisionStatus) =>
                  hasDecisionRule(v, approval.parentName),
              ]"
              :hide-details="true"
            >
              <v-btn-toggle
                density="compact"
                v-model="approval.status"
                class="btn-toggle"
                selected-class="selected-btn-toggle"
                :disabled="
                  readOnly ||
                  approval.saveDecisionInProgress ||
                  approval.decisionSaved
                "
                mandatory
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
            <template
              v-if="approval.parentStatus === FormSubmissionStatus.Pending"
            >
              <v-btn
                v-if="approval.decisionSaved"
                class="float-right"
                color="primary"
                variant="outlined"
                :loading="approval.saveDecisionInProgress"
                @click="changeDecision(approval)"
                >Edit
                <v-tooltip activator="parent" location="bottom"
                  >Allow changing the information previously
                  submitted.</v-tooltip
                ></v-btn
              >
              <v-btn
                v-else
                class="float-right"
                color="primary"
                variant="outlined"
                :loading="approval.saveDecisionInProgress"
                @click="saveDecision(approval)"
                >Save
                <v-tooltip activator="parent" location="bottom"
                  >Save a decision for this item only. This decision is not
                  final and can be reverted till the main submission is no
                  longer pending.</v-tooltip
                ></v-btn
              >
            </template>
          </v-row>
          <v-input
            class="float-right"
            v-model="approval.decisionSaved"
            :rules="[(v) => v || `${approval.parentName}, must be saved.`]"
            :hide-details="false"
          ></v-input>
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
      :show-primary-button="
        !readOnly && formSubmission.status === FormSubmissionStatus.Pending
      "
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
  FormSubmissionStatus,
} from "@/types";
import FormSubmissionItems from "./FormSubmissionItems.vue";
import { FormSubmissionsService } from "@/services/FormSubmissionsService";
import { useRules, useSnackBar } from "@/composables";
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
    const snackBar = useSnackBar();
    const { checkNotesLengthRule } = useRules();
    const formSubmission = ref({} as FormSubmissionMinistryAPIOutDTO);
    const formSubmissionItems = ref([] as FormSubmissionItem[]);
    const processing = ref(false);
    const approvalsForm = ref({} as VForm);
    const noteRefs = ref(
      new Map<FormSubmissionItemApproval, InstanceType<typeof VTextarea>>(),
    );

    const loadFormSubmission = async () => {
      try {
        formSubmission.value =
          (await FormSubmissionsService.shared.getFormSubmission(
            props.formSubmissionId,
          )) as FormSubmissionMinistryAPIOutDTO;
      } catch {
        snackBar.error("Unexpected error while loading the form submission.");
      }
      formSubmissionItems.value =
        formSubmission.value.submissionItems.map<FormSubmissionItem>(
          (submissionItem) => ({
            id: submissionItem.id,
            dynamicConfigurationId: submissionItem.dynamicFormConfigurationId,
            formType: submissionItem.formType,
            category: formSubmission.value.formCategory,
            formName: submissionItem.formDefinitionName,
            formData: submissionItem.submissionData,
            approval: {
              id: submissionItem.id,
              parentName: submissionItem.formType,
              parentStatus: formSubmission.value.status,
              noteDescription: submissionItem.decisionNoteDescription,
              status: submissionItem.decisionStatus,
              saveDecisionInProgress: false,
              decisionSaved: !!submissionItem.decisionNoteDescription,
            } as FormSubmissionItemApproval,
            files: [],
          }),
        );
    };

    watchEffect(async () => {
      await loadFormSubmission();
    });

    const submit = async () => {
      const validationResult = await approvalsForm.value.validate();
      if (!validationResult.valid) {
        const [errorSummary] = document.getElementsByClassName("error-summary");
        if (errorSummary) {
          errorSummary.scrollIntoView({ block: "center", behavior: "smooth" });
        }
        return;
      }
      try {
        processing.value = true;
        await FormSubmissionsService.shared.completeFormSubmission(
          formSubmission.value.id,
        );
        await loadFormSubmission();
        snackBar.success("Form submission completed.");
      } catch {
        snackBar.error(
          "Unexpected error while completing the form submission.",
        );
      } finally {
        processing.value = false;
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

    const saveDecision = async (approval: FormSubmissionItemApproval) => {
      const noteInput = noteRefs.value.get(approval);
      const errors = await noteInput?.validate();
      if (errors.length) {
        return;
      }
      try {
        approval.saveDecisionInProgress = true;
        await FormSubmissionsService.shared.submitItemDecision(approval.id, {
          decisionStatus: approval.status,
          noteDescription: approval.noteDescription,
        });
        approval.decisionSaved = true;
        snackBar.success(
          "Decision saved! The decision can be changed till the main submission is no longer pending.",
        );
      } catch {
        snackBar.error("Unexpected error while saving the decision.");
      } finally {
        approval.saveDecisionInProgress = false;
      }
    };

    const changeDecision = async (approval: FormSubmissionItemApproval) => {
      approval.decisionSaved = false;
    };

    return {
      FormSubmissionStatus,
      formSubmission,
      formSubmissionItems,
      processing,
      checkNotesLengthRule,
      hasDecisionRule,
      FormSubmissionDecisionStatus,
      submit,
      approvalsForm,
      captureNoteRef,
      saveDecision,
      changeDecision,
    };
  },
});
</script>
