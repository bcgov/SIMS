<template>
  <body-header
    title="Pending appeals"
    :records-count="applicationAppeals.count"
    sub-title="Appeals that require ministry review."
  >
    <template #actions>
      <v-text-field
        density="compact"
        label="Search name or application #"
        variant="outlined"
        v-model="searchCriteria"
        @keyup.enter="searchAppeals"
        prepend-inner-icon="mdi-magnify"
        hide-details="auto"
      >
      </v-text-field>
    </template>
  </body-header>
  <v-btn-toggle
    v-model="selectedFilter"
    mandatory
    color="primary"
    class="mb-4"
    density="compact"
  >
    <v-btn value="all" rounded="lg">All</v-btn>
    <v-btn value="application" rounded="lg">Application</v-btn>
    <v-btn value="other" rounded="lg">Other</v-btn>
  </v-btn-toggle>
  <content-group>
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
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  DataTableSortByOrder,
  PaginatedResults,
  PendingAppealsTableHeaders,
  DataTableOptions,
  PaginationOptions,
  DEFAULT_DATATABLE_PAGE_NUMBER,
} from "@/types";
import { useFormatters, useSnackBar } from "@/composables";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { StudentAppealPendingSummaryAPIOutDTO } from "@/services/http/dto/StudentAppeal.dto";
import { StudentAppealService } from "@/services/StudentAppealService";

const router = useRouter();
const { dateOnlyLongString, emptyStringFiller } = useFormatters();
const snackBar = useSnackBar();
const isLoading = ref(false);
const searchCriteria = ref("");
const selectedFilter = ref<"all" | "application" | "other">("all");
const applicationAppeals = ref(
  {} as PaginatedResults<StudentAppealPendingSummaryAPIOutDTO>,
);

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
 * non-application appeals are redirected to the standalone appeal requests page.
 * @param pendingAppeal pending appeal item to navigate to.
 */
const goToAppealsApproval = (
  pendingAppeal: StudentAppealPendingSummaryAPIOutDTO,
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
    name: AESTRoutesConst.STUDENT_APPEAL_REQUESTS_APPROVAL,
    params: {
      appealId: pendingAppeal.appealId,
    },
  });
};

const loadAppeals = async () => {
  try {
    isLoading.value = true;
    applicationAppeals.value =
      await StudentAppealService.shared.getPendingAppeals({
        page: currentPagination.page,
        pageLimit: currentPagination.pageLimit,
        sortField: currentPagination.sortField,
        sortOrder: currentPagination.sortOrder,
        searchCriteria: {
          appealType: selectedFilter.value,
          searchCriteria: searchCriteria.value,
        },
      });
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

watch(selectedFilter, async () => {
  await loadAppeals();
});
</script>
