<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator title="Ministry" sub-title="Manual Reassessment" />
    </template>

    <body-header-container>
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
            label="Applications"
            placeholder="Paste your applications here"
            variant="outlined"
            rows="8"
            auto-grow
            hide-details="auto"
          />

          <div class="d-flex justify-end mt-4">
            <check-permission-role :role="Role.AESTBatchReassessment">
              <template #="{ notAllowed }">
                <v-btn
                  color="primary"
                  :disabled="notAllowed || !applicationNumbers?.trim()"
                  @click="openConfirmSubmitModal"
                >
                  Submit
                </v-btn>
              </template>
            </check-permission-role>
          </div>
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

    <body-header-container>
      <template #header>
        <body-header
          title="Batch manual reassessment history"
          sub-title="View the history of batch manual reassessments. Each batch shows
            the submission details and processing status. View the results for a
            batch to review which applications were successfully reassessed and
            which failed, including any applicable error details."
        />
      </template>

      <content-group>
        <v-data-table
          :headers="BatchReassessmentHistoryHeaders"
          :items="batchReassessmentHistory"
          :loading="batchReassessmentHistoryLoading"
        >
          <template #[`item.submittedDate`]="{ item }">
            {{ getISODateHourMinuteString(item.submittedDate) }}
          </template>
          <template #[`item.status`]="{ item }">
            <status-chip-batch-reassessment :status="item.status" />
          </template>
        </v-data-table>
      </content-group>
    </body-header-container>
  </full-page-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Role } from "@/types";
import type { VForm } from "@/types";
import { BatchReassessmentHistoryHeaders } from "@/types/contracts/DataTableContract";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import StatusChipBatchReassessment from "@/components/generic/StatusChipBatchReassessment.vue";
import UserNoteConfirmModal, {
  UserNoteModal,
} from "@/components/common/modals/UserNoteConfirmModal.vue";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import {
  BatchSubmissionResultAPIOutDTO,
  BATCH_REASSESSMENT_MAX_APPLICATION_NUMBERS,
} from "@/services/http/dto";
import { ModalDialog, useFormatters, useSnackBar } from "@/composables";

const APPLICATION_NUMBER_SIZE = 10;

const snackBar = useSnackBar();
const { getISODateHourMinuteString } = useFormatters();

const applicationNumbers = ref("");
const batchReassessmentHistory = ref<BatchSubmissionResultAPIOutDTO[]>([]);
const batchReassessmentHistoryLoading = ref(false);
const batchReassessmentForm = ref({} as VForm);
const confirmBatchReassessmentModal = ref(
  {} as ModalDialog<UserNoteModal<void>>,
);

const checkApplicationNumbers = (value: string) => {
  if (!value?.trim()) {
    return "Application numbers are required.";
  }

  const entries = value
    .split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (!entries.length) {
    return "Application numbers are required.";
  }

  if (entries.length > BATCH_REASSESSMENT_MAX_APPLICATION_NUMBERS) {
    return `A maximum of ${BATCH_REASSESSMENT_MAX_APPLICATION_NUMBERS} application numbers can be submitted at once.`;
  }

  const hasInvalidEntry = entries.some(
    (entry) =>
      !new RegExp(String.raw`^\d{${APPLICATION_NUMBER_SIZE}}$`).test(entry),
  );
  if (hasInvalidEntry) {
    return `Each application number must be exactly ${APPLICATION_NUMBER_SIZE} numbers and be separated by spaces, line breaks, or commas.`;
  }

  return true;
};

const parseApplicationNumbers = () =>
  applicationNumbers.value
    .split(/[\s,]+/)
    .map((value) => value.trim())
    .filter(Boolean);

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
    await StudentAssessmentsService.shared.batchReassessment({
      applicationNumbers: parseApplicationNumbers(),
      note: userNoteModalResult.note,
    });
    snackBar.success("Batch reassessment triggered successfully.");
    batchReassessmentForm.value.reset();
    await loadBatchReassessmentHistory();
    return true;
  } catch {
    snackBar.error("Unexpected error while triggering batch reassessment.");
    return false;
  }
};

const loadBatchReassessmentHistory = async () => {
  batchReassessmentHistoryLoading.value = true;
  try {
    batchReassessmentHistory.value =
      await StudentAssessmentsService.shared.getBatchReassessment();
  } catch {
    snackBar.error("Unexpected error while loading the reassessment history.");
  } finally {
    batchReassessmentHistoryLoading.value = false;
  }
};

onMounted(loadBatchReassessmentHistory);
</script>
