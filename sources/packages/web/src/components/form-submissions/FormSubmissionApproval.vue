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
    <v-skeleton-loader v-if="formSubmissionLoading" type="image, article" />
    <v-form v-else ref="approvalsForm">
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
          <p
            v-if="showApprovalDetails && approval.decisionBy"
            class="brand-gray-text mt-4"
          >
            Decision given by <strong>{{ approval.decisionBy }}</strong> on
            <strong>{{
              getISODateHourMinuteString(approval.decisionDate)
            }}</strong>
          </p>
        </template>
      </form-submission-items>
    </v-form>
    <footer-buttons
      justify="space-between"
      :processing="processingCompletion"
      @secondary-click="$.emit('cancel')"
      secondary-label="Back"
      @primary-click="completeSubmission"
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
import { FormSubmissionService } from "@/services/FormSubmissionService";
import { useRules, useSnackBar, useFormatters } from "@/composables";
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
    const snackBar = useSnackBar();
    const { getISODateHourMinuteString } = useFormatters();
    const { checkNotesLengthRule } = useRules();
    const formSubmission = ref({} as FormSubmissionMinistryAPIOutDTO);
    const formSubmissionItems = ref([] as FormSubmissionItem[]);
    const formSubmissionLoading = ref(true);
    const processingCompletion = ref(false);
    const approvalsForm = ref({} as VForm);
    const noteRefs = ref(
      new Map<FormSubmissionItemApproval, InstanceType<typeof VTextarea>>(),
    );

    /**
     * Load the form definition and its items.
     */
    const loadFormSubmission = async () => {
      try {
        formSubmissionLoading.value = true;
        formSubmission.value =
          (await FormSubmissionService.shared.getFormSubmission(
            props.formSubmissionId,
          )) as FormSubmissionMinistryAPIOutDTO;
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
                decisionBy: submissionItem.decisionBy,
                decisionDate: submissionItem.decisionDate,
              } as FormSubmissionItemApproval,
            }),
          );
      } catch {
        snackBar.error("Unexpected error while loading the form submission.");
      } finally {
        formSubmissionLoading.value = false;
      }
    };

    watchEffect(async () => {
      await loadFormSubmission();
    });

    /**
     * Creates an association between an approval object and its
     * related note to allow the note validation to be triggered
     * outside the complete scope of the form validation.
     * @param noteInput note input where the note is entered.
     * @param approval object to be associated with the input.
     */
    const captureNoteRef = (
      noteInput: unknown,
      approval: FormSubmissionItemApproval,
    ) => {
      if (noteInput) {
        noteRefs.value.set(
          approval,
          noteInput as InstanceType<typeof VTextarea>,
        );
      }
    };

    /**
     * Indicates if a decision was made for an individual form,
     * which means, the decision in no longer pending.
     * @param value
     * @param parentName
     */
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
     * Mark the form submission as completed.
     */
    const completeSubmission = async () => {
      const validationResult = await approvalsForm.value.validate();
      if (!validationResult.valid) {
        const [errorSummary] = document.getElementsByClassName("error-summary");
        if (errorSummary) {
          errorSummary.scrollIntoView({ block: "center", behavior: "smooth" });
        }
        return;
      }
      try {
        processingCompletion.value = true;
        await FormSubmissionService.shared.completeFormSubmission(
          formSubmission.value.id,
        );
        await loadFormSubmission();
        snackBar.success("Form submission completed.");
      } catch {
        snackBar.error(
          "Unexpected error while completing the form submission.",
        );
      } finally {
        processingCompletion.value = false;
      }
    };

    /**
     * Save an item decision.
     */
    const saveDecision = async (approval: FormSubmissionItemApproval) => {
      const noteInput = noteRefs.value.get(approval);
      const errors = await noteInput?.validate();
      if (errors.length) {
        return;
      }
      try {
        approval.saveDecisionInProgress = true;
        const updatedAudit =
          await FormSubmissionService.shared.submitItemDecision(approval.id, {
            decisionStatus: approval.status,
            noteDescription: approval.noteDescription,
            lastUpdatedDate: approval.decisionDate,
          });
        approval.decisionDate = updatedAudit.decisionDate;
        approval.decisionBy = updatedAudit.decisionBy;
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

    /**
     * Reopen a previously submitted decision for edition.
     * @param approval decision to allow edit.
     */
    const changeDecision = async (approval: FormSubmissionItemApproval) => {
      approval.decisionSaved = false;
    };

    return {
      FormSubmissionStatus,
      formSubmission,
      formSubmissionItems,
      processingCompletion,
      checkNotesLengthRule,
      hasDecisionRule,
      FormSubmissionDecisionStatus,
      completeSubmission,
      approvalsForm,
      captureNoteRef,
      saveDecision,
      changeDecision,
      getISODateHourMinuteString,
      formSubmissionLoading,
    };
  },
});
</script>
