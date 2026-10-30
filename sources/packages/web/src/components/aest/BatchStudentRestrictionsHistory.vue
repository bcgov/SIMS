<template>
  <body-header-container :enable-card-view="true">
    <template #header>
      <body-header
        title="Batch restriction history"
        sub-title="View the history of batch restriction requests. Each batch shows the submission details."
      />
    </template>

    <content-group>
      <toggle-content
        :toggled="
          !batchStudentRestrictionsHistory.length &&
          !batchStudentRestrictionsHistoryLoading
        "
      >
        <v-data-table
          :headers="BatchStudentRestrictionsHistoryHeaders"
          :items="batchStudentRestrictionsHistory"
          :loading="batchStudentRestrictionsHistoryLoading"
          :mobile="isMobile"
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
          <template #[`item.restriction`]="{ item }">
            {{ item.restrictionCode }} - {{ item.restrictionDescription }}
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
        </v-data-table>
      </toggle-content>
    </content-group>
  </body-header-container>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { useDisplay } from "vuetify";
import { BatchStudentRestrictionsHistoryHeaders } from "@/types/contracts/DataTableContract";
import { BatchStudentRestrictionsSummaryAPIOutDTO } from "@/services/http/dto";
import { useFormatters, useSnackBar } from "@/composables";
import { RestrictionService } from "@/services/RestrictionService";

const snackBar = useSnackBar();
const { getISODateHourMinuteString } = useFormatters();
const { mobile: isMobile } = useDisplay();

const batchStudentRestrictionsHistory = ref<
  BatchStudentRestrictionsSummaryAPIOutDTO[]
>([]);
const batchStudentRestrictionsHistoryLoading = ref(false);

const loadBatchStudentRestrictionsHistory = async () => {
  batchStudentRestrictionsHistoryLoading.value = true;
  try {
    batchStudentRestrictionsHistory.value =
      await RestrictionService.shared.getBatchStudentRestrictions();
  } catch {
    snackBar.error(
      "Unexpected error while loading the batch student restrictions history.",
    );
  } finally {
    batchStudentRestrictionsHistoryLoading.value = false;
  }
};

watchEffect(loadBatchStudentRestrictionsHistory);

defineExpose({
  reload: loadBatchStudentRestrictionsHistory,
});
</script>
