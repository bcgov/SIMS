<template>
  <body-header
    title="Pending appeals"
    :records-count="applicationAppeals.count"
    sub-title="Appeals that require ministry review."
  />
  <search-table
    v-model="searchCriteria"
    search-label="Search name or application #"
    :loading="isLoading"
    @search="searchAppeals"
  >
    <template #append-search>
      <v-btn-toggle
        v-model="selectedFilter"
        color="primary"
        density="compact"
        class="btn-toggle"
        selected-class="selected-btn-toggle"
        @update:model-value="onFilterChange"
      >
        <v-btn value="all" rounded="xl" color="primary" class="mr-2">All</v-btn>
        <v-btn :value="true" rounded="xl" color="primary" class="mr-2"
          >Application</v-btn
        >
        <v-btn :value="false" rounded="xl" color="primary">Other</v-btn>
      </v-btn-toggle>
    </template>
    <toggle-content :toggled="!applicationAppeals.count && !isLoading">
      <v-data-table-server
        :headers="PendingAppealsTableHeaders"
        :items="applicationAppeals.results"
        :items-length="applicationAppeals.count"
        :loading="isLoading"
        :items-per-page="DEFAULT_PAGE_LIMIT"
        :items-per-page-options="ITEMS_PER_PAGE"
        @update:options="pageSortEvent"
        :mobile="isMobile"
      >
        <template #loading>
          <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
        </template>
        <template #[`item.submittedDate`]="{ item }">
          {{ dateOnlyLongString(item.submittedDate) }}
        </template>
        <template #[`item.firstName`]="{ item }">
          {{ emptyStringFiller(item.firstName) }}
        </template>
        <template #[`item.applicationNumber`]="{ item }">
          {{ emptyStringFiller(item.applicationNumber) }}
        </template>
        <template #[`item.appealType`]="{ item }">
          {{ item.applicationId ? "Application" : "Other" }}
        </template>
        <template #[`item.action`]="{ item }">
          <v-btn color="primary" @click="goToAppealsApproval(item)">View</v-btn>
        </template>
      </v-data-table-server>
    </toggle-content>
  </search-table>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  DataTableSortByOrder,
  PendingAppealsTableHeaders,
  DataTableOptions,
  PaginationOptions,
  DEFAULT_DATATABLE_PAGE_NUMBER,
  FormCategory,
} from "@/types";
import { useFormatters, useSnackBar } from "@/composables";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import {
  FormSubmissionPendingSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import { FormSubmissionService } from "@/services/FormSubmissionService";
import { useDisplay } from "vuetify";

const { mobile: isMobile } = useDisplay();
const router = useRouter();
const { dateOnlyLongString, emptyStringFiller } = useFormatters();
const snackBar = useSnackBar();
const isLoading = ref(false);
const searchCriteria = ref("");
const selectedFilter = ref<boolean | "all">("all");
const applicationFilter = computed(() =>
  selectedFilter.value === "all" ? undefined : selectedFilter.value,
);
const applicationAppeals = ref<
  PaginatedResultsAPIOutDTO<FormSubmissionPendingSummaryAPIOutDTO>
>({ results: [], count: 0 });

const DEFAULT_SORT_FIELD = "submittedDate";
const currentPagination: PaginationOptions = {
  page: DEFAULT_DATATABLE_PAGE_NUMBER,
  pageLimit: DEFAULT_PAGE_LIMIT,
  sortField: DEFAULT_SORT_FIELD,
  sortOrder: DataTableSortByOrder.DESC,
};

/**
 * Navigates to the common form submissions page to review and approve the pending appeal.
 * @param pendingAppeal pending appeal item to navigate to.
 */
const goToAppealsApproval = (
  pendingAppeal: FormSubmissionPendingSummaryAPIOutDTO,
) => {
  router.push({
    name: AESTRoutesConst.FORM_SUBMISSION_APPROVAL_FROM_PENDING_APPEALS,
    params: {
      formSubmissionId: pendingAppeal.formSubmissionId,
    },
  });
};

const loadAppeals = async () => {
  try {
    isLoading.value = true;
    applicationAppeals.value =
      await FormSubmissionService.shared.getPendingFormSubmissions(
        {
          page: currentPagination.page,
          pageLimit: currentPagination.pageLimit,
          sortField: currentPagination.sortField,
          sortOrder: currentPagination.sortOrder,
          searchCriteria: searchCriteria.value,
        },
        {
          hasApplicationScope: applicationFilter.value,
          formCategory: FormCategory.StudentAppeal,
        },
      );
  } catch {
    snackBar.error("Error loading appeals.");
  } finally {
    isLoading.value = false;
  }
};

const searchAppeals = async () => {
  await loadAppeals();
};

/**
 * Handles the filter toggle change. When all buttons are deselected (i.e., the
 * user clicks the currently active button), resets the selection back to "all"
 * to ensure at least one filter is always active.
 * @param value the new filter value from the toggle.
 */
const onFilterChange = async (value: boolean | "all" | undefined) => {
  if (value === undefined) {
    selectedFilter.value = "all";
  }
  await loadAppeals();
};

const pageSortEvent = async (event: DataTableOptions) => {
  currentPagination.page = event.page;
  currentPagination.pageLimit = event.itemsPerPage;
  if (event.sortBy.length) {
    const [sortBy] = event.sortBy;
    currentPagination.sortField = sortBy.key;
    currentPagination.sortOrder = sortBy.order;
  } else {
    currentPagination.sortField = DEFAULT_SORT_FIELD;
    currentPagination.sortOrder = DataTableSortByOrder.DESC;
  }
  await loadAppeals();
};

onMounted(async () => {
  await loadAppeals();
});
</script>
