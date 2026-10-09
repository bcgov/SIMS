<template>
  <full-page-container
    :full-width="true"
    :layout-template="LayoutTemplates.Centered"
  >
    <template #header>
      <header-navigator
        title="Back to batch reassessment"
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
        @search="searchApplications"
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
              {{ item.failureReason }}
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
import { onMounted, ref } from "vue";
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
import { useSnackBar } from "@/composables";
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
const loading = ref(false);
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
 * @param application application to navigate to.
 */
const goToAssessmentsSummary = (
  application: BatchReassessmentApplicationAPIOutDTO,
) => {
  router.push({
    name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
    params: {
      studentId: application.studentId,
      applicationId: application.applicationId,
    },
    query: { batchReassessmentId: props.batchReassessmentId },
  });
};

const loadApplications = async () => {
  try {
    loading.value = true;
    paginatedApplications.value =
      await BatchReassessmentService.shared.getBatchReassessmentApplications(
        props.batchReassessmentId,
        { ...currentPagination, searchCriteria: searchCriteria.value },
        selectedFilter.value === ResultFilter.All
          ? undefined
          : selectedFilter.value,
      );
  } catch {
    snackBar.error(
      "Unexpected error while loading the batch reassessment results.",
    );
  } finally {
    loading.value = false;
  }
};

const searchApplications = async () => {
  await loadApplications();
};

const pageEvent = async (event: DataTableOptions) => {
  currentPagination.page = event.page;
  currentPagination.pageLimit = event.itemsPerPage;
  await loadApplications();
};

onMounted(async () => {
  await loadApplications();
});
</script>
