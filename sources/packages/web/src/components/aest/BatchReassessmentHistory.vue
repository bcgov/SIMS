<template>
  <body-header-container :enable-card-view="true">
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
      <toggle-content
        :toggled="
          !batchReassessmentHistory.length && !batchReassessmentHistoryLoading
        "
      >
        <v-data-table
          :headers="BatchReassessmentHistoryHeaders"
          :items="batchReassessmentHistory"
          :loading="batchReassessmentHistoryLoading"
        >
          <template #[`item.batchNumber`]="{ item }">
            {{ item.batchNumber }}
          </template>
          <template #[`item.submittedDate`]="{ item }">
            {{ getISODateHourMinuteString(item.createdAt) }}
          </template>
          <template #[`item.submittedBy`]="{ item }">
            {{ item.creatorName }}
          </template>
          <template #[`item.totalCount`]="{ item }">
            {{ item.totalCount }}
          </template>
          <template #[`item.successCount`]="{ item }">
            {{ item.successCount }}
          </template>
          <template #[`item.failureCount`]="{ item }">
            {{ item.failureCount }}
          </template>
          <template #[`item.status`]="{ item }">
            <status-chip-batch-reassessment :status="item.status" />
          </template>
        </v-data-table>
      </toggle-content>
    </content-group>
  </body-header-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { BatchReassessmentHistoryHeaders } from "@/types/contracts/DataTableContract";
import StatusChipBatchReassessment from "@/components/generic/StatusChipBatchReassessment.vue";
import { BatchReassessmentSummaryAPIOutDTO } from "@/services/http/dto";
import { useFormatters, useSnackBar } from "@/composables";
import { BatchReassessmentService } from "@/services/BatchReassessmentService";

const snackBar = useSnackBar();
const { getISODateHourMinuteString } = useFormatters();

const batchReassessmentHistory = ref<BatchReassessmentSummaryAPIOutDTO[]>([]);
const batchReassessmentHistoryLoading = ref(false);

const loadBatchReassessmentHistory = async () => {
  batchReassessmentHistoryLoading.value = true;
  try {
    batchReassessmentHistory.value =
      await BatchReassessmentService.shared.getBatchReassessments();
  } catch {
    snackBar.error("Unexpected error while loading the reassessment history.");
  } finally {
    batchReassessmentHistoryLoading.value = false;
  }
};

onMounted(loadBatchReassessmentHistory);

defineExpose({
  reload: loadBatchReassessmentHistory,
});
</script>
