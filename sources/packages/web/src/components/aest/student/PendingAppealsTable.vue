<template>
  <body-header
    title="Pending appeals"
    :records-count="applicationAppeals.count"
    sub-title="Appeals that require ministry review."
  />
  <content-group>
    <v-row class="m-0 p-0 mb-2" align="center">
      <v-col md="auto" class="flex-grow-1 pa-0 pr-2 mb-1">
        <v-text-field
          density="compact"
          label="Search name or application #"
          variant="outlined"
          v-model="searchCriteria"
          @keyup.enter="searchAppeals"
          prepend-inner-icon="mdi-magnify"
          hide-details="auto"
        />
      </v-col>
      <v-col cols="auto" class="pa-0 pr-2">
        <v-btn color="primary" @click="searchAppeals">Search</v-btn>
      </v-col>
      <v-col cols="auto" class="pa-0">
        <v-btn-toggle
          v-model="selectedFilter"
          color="primary"
          density="compact"
          class="btn-toggle"
          selected-class="selected-btn-toggle"
          @update:model-value="searchAppeals"
        >
          <v-btn value="all" rounded="xl" color="primary" class="mr-2"
            >All</v-btn
          >
          <v-btn :value="true" rounded="xl" color="primary" class="mr-2"
            >Application</v-btn
          >
          <v-btn :value="false" rounded="xl" color="primary">Other</v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>
    <toggle-content :toggled="!applicationAppeals.count && !isLoading">
      <v-data-table-server
        :headers="PendingAppealsTableHeaders"
        :items="applicationAppeals.results"
        :items-length="applicationAppeals.count"
        :loading="isLoading"
        :items-per-page="DEFAULT_PAGE_LIMIT"
        :items-per-page-options="ITEMS_PER_PAGE"
        @update:options="pageSortEvent"
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
  </content-group>
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
} from "@/types";
import { useFormatters, useSnackBar } from "@/composables";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import {
  FormSubmissionPendingAppealSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import { FormSubmissionService } from "@/services/FormSubmissionService";

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
  PaginatedResultsAPIOutDTO<FormSubmissionPendingAppealSummaryAPIOutDTO>
>({ results: [], count: 0 });

const DEFAULT_SORT_FIELD = "submittedDate";
const currentPagination: PaginationOptions = {
  page: DEFAULT_DATATABLE_PAGE_NUMBER,
  pageLimit: DEFAULT_PAGE_LIMIT,
  sortField: DEFAULT_SORT_FIELD,
  sortOrder: DataTableSortByOrder.DESC,
};

/**
 * Navigates to the appropriate page to review and approve the pending appeal.
 * Application appeals are redirected to the assessments summary page, while
 * non-application appeals are redirected to the form submission approval page.
 * @param pendingAppeal pending appeal item to navigate to.
 */
const goToAppealsApproval = (
  pendingAppeal: FormSubmissionPendingAppealSummaryAPIOutDTO,
) => {
  if (pendingAppeal.applicationId) {
    router.push({
      name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
      params: {
        applicationId: pendingAppeal.applicationId,
        studentId: pendingAppeal.studentId,
      },
    });
    return;
  }
  router.push({
    name: AESTRoutesConst.STUDENT_FORM_SUBMISSION_APPROVAL,
    params: {
      formSubmissionId: pendingAppeal.formSubmissionId,
    },
  });
};

const loadAppeals = async () => {
  try {
    isLoading.value = true;
    applicationAppeals.value =
      await FormSubmissionService.shared.getPendingAppeals(
        {
          page: currentPagination.page,
          pageLimit: currentPagination.pageLimit,
          sortField: currentPagination.sortField,
          sortOrder: currentPagination.sortOrder,
          searchCriteria: searchCriteria.value,
        },
        { hasApplicationScope: applicationFilter.value },
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
