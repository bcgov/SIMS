<template>
  <full-page-container
    :full-width="true"
    :layout-template="LayoutTemplates.Centered"
  >
    <template #header>
      <header-navigator
        title="Batch Reassessment"
        :route-location="{ name: AESTRoutesConst.BATCH_REASSESSMENT }"
        sub-title="Batch manual reassessment outcome"
      />
    </template>
    <body-header-container
      :enable-card-view="true"
      title="Batch manual reassessment results"
      :records-count="paginatedApplications.count"
    >
      <search-table
        v-model="searchCriteria"
        search-label="Search application number"
        :loading="loading"
        @search="loadApplications"
      >
        <template #append-search>
          <v-btn-toggle
            v-model="selectedFilter"
            mandatory
            color="primary"
            density="compact"
            class="btn-toggle"
            selected-class="selected-btn-toggle"
            @update:model-value="loadApplications"
          >
            <v-btn
              v-for="filter in ResultFilter"
              :key="filter"
              :value="filter"
              rounded="xl"
              color="primary"
              class="mr-2"
              >{{ filter }}</v-btn
            >
          </v-btn-toggle>
        </template>
        <toggle-content
          :toggled="!paginatedApplications.count && !loading"
          message="No applications found."
        >
          <v-data-table-server
            :headers="BatchReassessmentApplicationHeaders"
            :items="paginatedApplications.results"
            :items-length="paginatedApplications.count"
            :loading="loading"
            :items-per-page="DEFAULT_PAGE_LIMIT"
            :items-per-page-options="ITEMS_PER_PAGE"
            @update:options="pageEvent"
            :mobile="isMobile"
          >
            <template #loading>
              <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
            </template>
            <template #[`item.applicationNumber`]="{ item }">
              {{ item.applicationNumber }}
            </template>
            <template #[`item.result`]="{ item }">
              <status-chip-batch-reassessment-application-result
                :status="item.result"
              />
            </template>
            <template #[`item.failureReason`]="{ item }">
              {{ emptyStringFiller(item.failureReason) }}
            </template>
            <template #[`item.action`]="{ item }">
              <v-btn
                v-if="item.applicationId"
                color="primary"
                variant="outlined"
                @click="goToAssessmentsSummary(item)"
                >View</v-btn
              >
            </template>
          </v-data-table-server>
        </toggle-content>
      </search-table>
    </body-header-container>
  </full-page-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import {
  BatchReassessmentApplicationHeaders,
  BatchReassessmentApplicationResult,
  DataTableOptions,
  DEFAULT_DATATABLE_PAGE_NUMBER,
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  LayoutTemplates,
  PaginationOptions,
} from "@/types";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import {
  BatchReassessmentApplicationAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import { BatchReassessmentService } from "@/services/BatchReassessmentService";
import { useFormatters, useSnackBar } from "@/composables";
import StatusChipBatchReassessmentApplicationResult from "@/components/generic/StatusChipBatchReassessmentApplicationResult.vue";

const ResultFilter = {
  All: "All",
  ...BatchReassessmentApplicationResult,
} as const;

interface Props {
  batchReassessmentId: number;
}

const props = defineProps<Props>();
const { mobile: isMobile } = useDisplay();
const router = useRouter();
const snackBar = useSnackBar();
const { emptyStringFiller } = useFormatters();
// Starts as loading to render the data table, which triggers the initial load on mount.
const loading = ref(true);
const searchCriteria = ref("");
const selectedFilter = ref<BatchReassessmentApplicationResult | "All">(
  ResultFilter.All,
);
const paginatedApplications = ref<
  PaginatedResultsAPIOutDTO<BatchReassessmentApplicationAPIOutDTO>
>({ results: [], count: 0 });

const currentPagination: PaginationOptions = {
  page: DEFAULT_DATATABLE_PAGE_NUMBER,
  pageLimit: DEFAULT_PAGE_LIMIT,
};

/**
 * Navigates to the application assessments, allowing the user to navigate back to this batch.
 * When the reassessed application is no longer the current version, navigates to the
 * assessments of that application version instead.
 * @param application application to navigate to.
 */
const goToAssessmentsSummary = (
  application: BatchReassessmentApplicationAPIOutDTO,
) => {
  const query = { batchReassessmentId: props.batchReassessmentId };
  if (application.applicationId !== application.currentApplicationId) {
    router.push({
      name: AESTRoutesConst.ASSESSMENTS_SUMMARY_VERSION,
      params: {
        studentId: application.studentId,
        applicationId: application.currentApplicationId,
        versionApplicationId: application.applicationId,
      },
      query,
    });
    return;
  }
  router.push({
    name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
    params: {
      studentId: application.studentId,
      applicationId: application.applicationId,
    },
    query,
  });
};

const loadApplications = async () => {
  try {
    loading.value = true;
    const criteria: Record<string, string> = {
      searchCriteria: searchCriteria.value,
    };
    if (selectedFilter.value !== ResultFilter.All) {
      criteria.result = selectedFilter.value;
    }
    paginatedApplications.value =
      await BatchReassessmentService.shared.getBatchReassessmentApplications(
        props.batchReassessmentId,
        { ...currentPagination, searchCriteria: criteria },
      );
  } catch {
    snackBar.error(
      "Unexpected error while loading the batch reassessment results.",
    );
  } finally {
    loading.value = false;
  }
};

/**
 * Page event handler.
 * @param event The data table page event.
 */
const pageEvent = async (event: DataTableOptions) => {
  currentPagination.page = event.page;
  currentPagination.pageLimit = event.itemsPerPage;
  await loadApplications();
};
</script>
