<template>
  <body-header-container :enable-card-view="false">
    <template #header>
      <form-submission-approval-header :form-submission="formSubmission" />
    </template>
    <content-group>
      <v-skeleton-loader v-if="formSubmissionLoading" type="image, article" />
      <v-form v-else ref="approvalsForm">
        <error-summary :errors="approvalsForm?.errors" />
        <form-submission-items
          :submission-items="formSubmissionItems"
          :read-only="true"
        >
          <template #decision="{ decision }" v-if="canShowDecisionDetails">
            <h4 class="category-header-medium brand-gray-text">
              Current decision
            </h4>
            <v-divider />
            <v-textarea
              :ref="(el) => captureNoteRef(el, decision)"
              class="my-4"
              label="Notes"
              variant="outlined"
              v-model="decision.decisionNoteDescription"
              hide-details="auto"
              :rules="[
                (v) => checkNotesLengthRule(v, `${decision.parentName}, notes`),
              ]"
              required
              :readonly="decision.decisionSaved"
              :disabled="readOnly || decision.saveDecisionInProgress"
            />
            <v-row justify="space-between" class="mt-2 mb-1 mx-0">
              <v-input
                v-model="decision.decisionStatus"
                :rules="[
                  (v: FormSubmissionDecisionStatus) =>
                    hasDecisionRule(v, decision.parentName),
                ]"
                :hide-details="true"
              >
                <v-btn-toggle
                  density="compact"
                  v-model="decision.decisionStatus"
                  class="btn-toggle"
                  selected-class="selected-btn-toggle"
                  :disabled="
                    readOnly ||
                    decision.saveDecisionInProgress ||
                    decision.decisionSaved
                  "
                  mandatory
                >
                  <v-btn
                    v-for="decisionStatus of decisionStatusOptions"
                    :key="decisionStatus.value"
                    class="text-white"
                    :color="decisionStatus.color"
                    :value="decisionStatus.value"
                    >{{ decisionStatus.value }}</v-btn
                  >
                </v-btn-toggle>
              </v-input>
              <!-- Allow editing a decision while the main submission is still pending. -->
              <template
                v-if="decision.parentStatus === FormSubmissionStatus.Pending"
              >
                <v-btn
                  v-if="decision.decisionSaved"
                  class="float-right"
                  color="primary"
                  variant="outlined"
                  :loading="decision.saveDecisionInProgress"
                  @click="changeDecision(decision)"
                  >Edit
                  <v-tooltip activator="parent" location="bottom"
                    >Allow changing the information previously
                    submitted.</v-tooltip
                  ></v-btn
                >
                <template v-else>
                  <v-btn
                    class="float-right mr-2"
                    color="primary"
                    variant="outlined"
                    :loading="decision.saveDecisionInProgress"
                    @click="cancelChangeDecision(decision)"
                    >Cancel
                  </v-btn>
                  <v-btn
                    class="float-right"
                    color="primary"
                    :loading="decision.saveDecisionInProgress"
                    @click="saveDecision(decision)"
                    >Save
                    <v-tooltip activator="parent" location="bottom"
                      >Save a decision for this item only. This decision is not
                      final and can be reverted till the main submission is no
                      longer pending.</v-tooltip
                    ></v-btn
                  >
                </template>
              </template>
            </v-row>
            <v-input
              class="float-right"
              v-model="decision.decisionSaved"
              :rules="[(v) => v || `${decision.parentName}, must be saved.`]"
              :hide-details="false"
            ></v-input>
            <!-- Audit for latest decision made on this item. -->
            <p v-if="decision.decisionBy" class="brand-gray-text mt-4">
              Last updated by <strong>{{ decision.decisionBy }}</strong> on
              <strong>{{
                getISODateHourMinuteString(decision.decisionDate)
              }}</strong>
            </p>
            <!-- Timeline with the decision history. -->
            <template v-if="decision.decisionHistory?.length">
              <v-divider />
              <form-submission-decision-history
                :decision-history="decision.decisionHistory"
              />
            </template>
          </template>
        </form-submission-items>
      </v-form>
    </content-group>
    <footer-buttons
      justify="space-between"
      :processing="processingCompletion"
      @primary-click="completeSubmission"
      primary-label="Submit final decision"
      :show-primary-button="canSubmitFinalDecision"
      :show-secondary-button="false"
    ></footer-buttons>
  </body-header-container>
  <confirm-modal
    title="Outdated data"
    ref="outdatedDecisionModal"
    ok-label="Refresh data"
    text="The information displayed is no longer current due to a recent update. Would you like to refresh the form to view the latest data?"
  />
  <confirm-modal
    title="Confirm final decision"
    ref="finalDecisionModal"
    ok-label="Submit final decision"
    text="Please confirm your final decision. Note that this submission is final and cannot be reversed."
  />
</template>

<script lang="ts">
import { computed, defineComponent, ref, watchEffect } from "vue";
import {
  FormSubmissionItem,
  FormSubmissionItemDecision,
  FormSubmissionDecisionStatus,
  VForm,
  FormSubmissionStatus,
  ApiProcessError,
} from "@/types";
import FormSubmissionItems from "./FormSubmissionItems.vue";
import { FormSubmissionService } from "@/services/FormSubmissionService";
import {
  useRules,
  useSnackBar,
  useFormatters,
  ModalDialog,
  useFormSubmission,
} from "@/composables";
import { VTextarea } from "vuetify/lib/components";
import {
  FormSubmissionMinistryAPIOutDTO,
  FormSubmissionItemMinistryAPIOutDTO,
} from "@/services/http/dto";
import { FORM_SUBMISSION_ITEM_OUTDATED } from "@/constants";
import ConfirmModal from "@/components/common/modals/ConfirmModal.vue";
import FormSubmissionDecisionHistory from "./FormSubmissionDecisionHistory.vue";
import FormSubmissionApprovalHeader from "./FormSubmissionApprovalHeader.vue";

type FormSubmission = Pick<
  FormSubmissionMinistryAPIOutDTO,
  "id" | "formCategory" | "status" | "hasApprovalAuthorization"
>;

export default defineComponent({
  emits: {
    loaded: (submission: FormSubmissionMinistryAPIOutDTO) => !!submission,
  },
  components: {
    FormSubmissionItems,
    FormSubmissionDecisionHistory,
    ConfirmModal,
    FormSubmissionApprovalHeader,
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
    showDecisionDetails: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  setup(props, { emit }) {
    const snackBar = useSnackBar();
    const { mapFormSubmissionDecisionStatus } = useFormSubmission();
    const { getISODateHourMinuteString } = useFormatters();
    const { checkNotesLengthRule } = useRules();
    const outdatedDecisionModal = ref({} as ModalDialog<boolean>);
    const finalDecisionModal = ref({} as ModalDialog<boolean>);
    const formSubmission = ref({} as FormSubmission);
    const formSubmissionItems = ref([] as FormSubmissionItem[]);
    const formSubmissionLoading = ref(true);
    const processingCompletion = ref(false);
    const approvalsForm = ref({} as VForm);
    const noteRefs = ref(
      new Map<FormSubmissionItemDecision, InstanceType<typeof VTextarea>>(),
    );

    /**
     * Decision options to be selected by the user
     * while providing a decision.
     */
    const decisionStatusOptions = [
      FormSubmissionDecisionStatus.Pending,
      FormSubmissionDecisionStatus.Approved,
      FormSubmissionDecisionStatus.Declined,
    ].map((decisionStatus) => ({
      color: mapFormSubmissionDecisionStatus(decisionStatus),
      value: decisionStatus,
    }));

    const canShowDecisionDetails = computed(
      () =>
        props.showDecisionDetails &&
        formSubmission.value.hasApprovalAuthorization,
    );

    const canSubmitFinalDecision = computed(
      () =>
        !props.readOnly &&
        formSubmission.value.status === FormSubmissionStatus.Pending &&
        formSubmission.value.hasApprovalAuthorization,
    );

    /**
     * Load the form definition and its items.
     */
    const loadFormSubmission = async () => {
      try {
        formSubmissionLoading.value = true;
        const submission =
          (await FormSubmissionService.shared.getFormSubmission(
            props.formSubmissionId,
          )) as FormSubmissionMinistryAPIOutDTO;
        emit("loaded", submission);
        // Keeps only the necessary properties for this UI.
        formSubmission.value = {
          id: submission.id,
          formCategory: submission.formCategory,
          status: submission.status,
          hasApprovalAuthorization: submission.hasApprovalAuthorization,
        };
        // Adapt the items to a UI model to render each item
        // and a internal modal to provide the approval.
        formSubmissionItems.value =
          submission.submissionItems.map<FormSubmissionItem>(
            (submissionItem) => ({
              id: submissionItem.id,
              dynamicConfigurationId: submissionItem.dynamicFormConfigurationId,
              formType: submissionItem.formType,
              category: formSubmission.value.formCategory,
              formName: submissionItem.formDefinitionName,
              formData: submissionItem.submissionData,
              decision: assignItemDecisionProperties(
                submissionItem,
                formSubmission.value.status,
              ),
            }),
          );
      } catch {
        snackBar.error("Unexpected error while loading the form submission.");
      } finally {
        formSubmissionLoading.value = false;
      }
    };

    /**
     * Creates the submission item to handle the decision.
     * This centralizes the logic to populates a single  decision section that must
     * be refreshed when a new decision in added to the history or when an outdated
     * item is detected and the user would like to get the most recent data.
     * @param submissionItem API returned submission item.
     * @param parentStatus submission main status required
     * for the UI be adjusted accordingly.
     * @returns UI model to handle the approval.
     */
    const assignItemDecisionProperties = (
      submissionItem: FormSubmissionItemMinistryAPIOutDTO,
      parentStatus: FormSubmissionStatus,
      options?: { decision?: FormSubmissionItemDecision },
    ): FormSubmissionItemDecision => {
      const decision = options?.decision ?? ({} as FormSubmissionItemDecision);
      decision.submissionItemId = submissionItem.id;
      decision.parentName = submissionItem.formType;
      decision.parentStatus = parentStatus;
      decision.decisionStatus = submissionItem.decisionStatus;
      decision.saveDecisionInProgress = false;
      decision.decisionSaved =
        !!submissionItem.currentDecision?.decisionNoteDescription;
      decision.decisionBy = submissionItem.currentDecision?.decisionBy;
      decision.decisionDate = submissionItem.currentDecision?.decisionDate;
      decision.decisionNoteDescription =
        submissionItem.currentDecision?.decisionNoteDescription;
      decision.lastUpdateDate = submissionItem.updatedAt;
      decision.decisionHistory = submissionItem.decisions?.map(
        (decisionEntry) => ({
          id: decisionEntry.id,
          decisionStatus: decisionEntry.decisionStatus,
          decisionDate: decisionEntry.decisionDate,
          decisionBy: decisionEntry.decisionBy,
          decisionNoteDescription: decisionEntry.decisionNoteDescription,
          statusColor: mapFormSubmissionDecisionStatus(
            decisionEntry.decisionStatus,
          ),
        }),
      );
      return decision;
    };

    /**
     * Reload the decision-related data to refresh only the updated data.
     * @param itemId updated item to have the data refreshed.
     */
    const reLoadFormSubmissionItem = async (itemId: number) => {
      try {
        const submission =
          (await FormSubmissionService.shared.getFormSubmission(
            props.formSubmissionId,
            { itemId },
          )) as FormSubmissionMinistryAPIOutDTO;
        const itemToUpdate = formSubmissionItems.value.find(
          (item) => item.decision?.submissionItemId === itemId,
        );
        if (!itemToUpdate?.decision) {
          throw new Error("Expected item to be updated was not found.");
        }
        const [reloadedSubmissionItem] = submission.submissionItems;
        assignItemDecisionProperties(
          reloadedSubmissionItem,
          submission.status,
          {
            decision: itemToUpdate.decision,
          },
        );
      } catch {
        snackBar.error("Unexpected error while loading updated decision.");
      }
    };

    /**
     * Creates an association between an approval object and its
     * related note to allow the note validation to be triggered
     * outside the complete scope of the form validation.
     * @param noteInput note input where the note is entered.
     * @param approval object to be associated with the input.
     */
    const captureNoteRef = (
      noteInput: unknown,
      approval: FormSubmissionItemDecision,
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
     * Save an item decision.
     */
    const saveDecision = async (decision: FormSubmissionItemDecision) => {
      const noteInput = noteRefs.value.get(decision);
      const errors = await noteInput?.validate();
      if (errors.length) {
        return;
      }
      try {
        decision.saveDecisionInProgress = true;
        await FormSubmissionService.shared.submitItemDecision(
          decision.submissionItemId,
          {
            decisionStatus: decision.decisionStatus,
            noteDescription: decision.decisionNoteDescription as string,
            lastUpdateDate: decision.lastUpdateDate,
          },
        );
        await reLoadFormSubmissionItem(decision.submissionItemId);
        snackBar.success(
          "Decision saved! The decision can be changed till the main submission is no longer pending.",
        );
      } catch (error: unknown) {
        if (error instanceof ApiProcessError) {
          if (error.errorType === FORM_SUBMISSION_ITEM_OUTDATED) {
            decision.saveDecisionInProgress = false;
            const modalResult = await outdatedDecisionModal.value.showModal();
            if (modalResult) {
              await reLoadFormSubmissionItem(decision.submissionItemId);
            }
          }
          return;
        }
        snackBar.error("Unexpected error while saving the decision.");
      } finally {
        decision.saveDecisionInProgress = false;
      }
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
      const confirm = await finalDecisionModal.value.showModal();
      if (!confirm) {
        return;
      }
      try {
        processingCompletion.value = true;
        const lastUpdatedInfo = formSubmissionItems.value.map((item) => ({
          submissionItemId: item.id,
          lastUpdateDate: item.decision?.lastUpdateDate as Date,
        }));
        await FormSubmissionService.shared.completeFormSubmission(
          formSubmission.value.id,
          { items: lastUpdatedInfo },
        );
        await loadFormSubmission();
        snackBar.success("Form submission completed.");
      } catch (error: unknown) {
        if (error instanceof ApiProcessError) {
          if (error.errorType === FORM_SUBMISSION_ITEM_OUTDATED) {
            processingCompletion.value = false;
            const modalResult = await outdatedDecisionModal.value.showModal();
            if (modalResult) {
              await loadFormSubmission();
            }
          }
          return;
        }
        snackBar.error("Unexpected error while saving the decision.");
      } finally {
        processingCompletion.value = false;
      }
    };

    /**
     * Reopen a previously submitted decision for edition.
     * @param approval decision to allow edit.
     */
    const changeDecision = (decision: FormSubmissionItemDecision): void => {
      decision.decisionSaved = false;
    };

    /**
     * Cancel a request to edit a decision and reloads the data.
     * @param decision
     */
    const cancelChangeDecision = async (
      decision: FormSubmissionItemDecision,
    ): Promise<void> => {
      await reLoadFormSubmissionItem(decision.submissionItemId);
    };

    watchEffect(async () => {
      await loadFormSubmission();
    });

    return {
      canShowDecisionDetails,
      canSubmitFinalDecision,
      decisionStatusOptions,
      outdatedDecisionModal,
      finalDecisionModal,
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
      cancelChangeDecision,
      getISODateHourMinuteString,
      formSubmissionLoading,
    };
  },
});
</script>
