<template>
  <full-page-container
    :full-width="true"
    :layout-template="LayoutTemplates.Centered"
  >
    <template #header>
      <header-navigator title="Ministry" sub-title="Batch Reassessment" />
    </template>
    <body-header-container :enable-card-view="true">
      <template #header>
        <body-header
          title="Batch manual reassessment"
          sub-title="Enter the application numbers that require manual reassessment."
        />
      </template>
      <content-group>
        <v-form ref="batchReassessmentForm">
          <v-textarea
            v-model="applicationNumbers"
            :rules="[checkApplicationNumbers]"
            label="Enter applications here"
            variant="outlined"
            max-rows="20"
            auto-grow
            hide-details="auto"
          />
          <footer-buttons
            primary-label="Submit"
            justify="end"
            @primary-click="openConfirmSubmitModal"
            :disable-primary-button="!applicationNumbers?.trim()"
            :show-secondary-button="false"
          />
        </v-form>
      </content-group>
    </body-header-container>

    <user-note-confirm-modal
      title="Batch manual reassessment"
      ref="confirmBatchReassessmentModal"
      ok-label="Submit"
    >
      <template #content>
        <p>
          Are you sure you want to manually reassess all entered applications?
        </p>
        <p>
          Note: This will only manually reassess the calculations of these
          assessments.
        </p>
      </template>
    </user-note-confirm-modal>

    <batch-reassessment-history ref="batchReassessmentHistory" />
  </full-page-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ApiProcessError, LayoutTemplates } from "@/types";
import type { VForm } from "@/types";
import BatchReassessmentHistory from "@/components/aest/BatchReassessmentHistory.vue";
import UserNoteConfirmModal, {
  UserNoteModal,
} from "@/components/common/modals/UserNoteConfirmModal.vue";
import { ModalDialog, useSnackBar } from "@/composables";
import { BatchReassessmentService } from "@/services/BatchReassessmentService";

const APPLICATION_NUMBER_SIZE = 10;
const APPLICATION_NUMBER_REGEX = /[\s,]+/;

const MAX_APPLICATION_NUMBERS = 20000;

const snackBar = useSnackBar();

const applicationNumbers = ref("");
const batchReassessmentHistory = ref(
  {} as InstanceType<typeof BatchReassessmentHistory>,
);
const batchReassessmentForm = ref({} as VForm);
const confirmBatchReassessmentModal = ref(
  {} as ModalDialog<UserNoteModal<void>>,
);

const checkApplicationNumbers = (value: string) => {
  if (!value?.trim()) {
    return "Application numbers are required.";
  }

  const entries = value.split(APPLICATION_NUMBER_REGEX).filter(Boolean);

  if (!entries.length) {
    return "Application numbers are required.";
  }

  if (entries.length > MAX_APPLICATION_NUMBERS) {
    return `A maximum of ${MAX_APPLICATION_NUMBERS} application numbers can be submitted at once.`;
  }

  const hasInvalidEntry = entries.some(
    (entry) =>
      !new RegExp(String.raw`^\d{${APPLICATION_NUMBER_SIZE}}$`).test(entry),
  );
  if (hasInvalidEntry) {
    return `Each application number must be exactly ${APPLICATION_NUMBER_SIZE} digits and be separated by spaces, line breaks, or commas.`;
  }

  return true;
};

const parseApplicationNumbers = () =>
  applicationNumbers.value.split(APPLICATION_NUMBER_REGEX).filter(Boolean);

const openConfirmSubmitModal = async () => {
  const { valid } = await batchReassessmentForm.value.validate();
  if (!valid) {
    return;
  }

  await confirmBatchReassessmentModal.value.showModal(
    undefined,
    submitReassessment,
  );
};

const submitReassessment = async (
  userNoteModalResult: UserNoteModal<void>,
): Promise<boolean> => {
  try {
    await BatchReassessmentService.shared.createBatchReassessment({
      applicationNumbers: parseApplicationNumbers(),
      note: userNoteModalResult.note,
    });
    snackBar.success("Batch reassessment triggered successfully.");
    batchReassessmentForm.value.reset();
    await batchReassessmentHistory.value.reload();
    return true;
  } catch (error) {
    if (error instanceof ApiProcessError) {
      snackBar.error(error.message);
      return false;
    }
    snackBar.error("Unexpected error while triggering batch reassessment.");
    return false;
  }
};
</script>
