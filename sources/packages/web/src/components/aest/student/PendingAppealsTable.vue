<template>
  <body-header
    :title="pageTitle"
    :records-count="applicationAppeals.count"
    :sub-title="pageDescription"
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
  <content-group>
    <toggle-content :toggled="!applicationAppeals.count && !isLoading">
      <v-data-table-server
        :headers="PendingChangeRequestsTableHeaders"
        :items="applicationAppeals.results"
        :items-length="applicationAppeals.count"
        :loading="isLoading"
        :items-per-page="DEFAULT_PAGE_LIMIT"
        :items-per-page-options="PAGINATION_LIST"
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
        <template #[`item.action`]="{ item }">
          <v-btn
            color="primary"
            @click="gotToAssessmentsSummary(item.applicationId, item.studentId)"
            >View</v-btn
          >
        </template>
      </v-data-table-server>
    </toggle-content>
  </content-group>
</template>

<script lang="ts">
import { ref, onMounted, defineComponent, computed } from "vue";
import { useRouter } from "vue-router";
import {
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  DataTableSortOrder,
  PaginatedResults,
  PendingChangeRequestsTableHeaders,
  DataTableOptions,
  PaginationOptions,
} from "@/types";
import { useFormatters, useSnackBar } from "@/composables";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { StudentAppealPendingSummaryAPIOutDTO } from "@/services/http/dto/StudentAppeal.dto";
import { StudentAppealService } from "@/services/StudentAppealService";

export default defineComponent({
  props: {
    appealsType: {
      type: String as () => "legacy-change-request" | "appeal",
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const { dateOnlyLongString, emptyStringFiller } = useFormatters();
    const snackBar = useSnackBar();
    const isLoading = ref(false);
    const searchCriteria = ref("");
    const applicationAppeals = ref(
      {} as PaginatedResults<StudentAppealPendingSummaryAPIOutDTO>,
    );

    const DEFAULT_SORT_FIELD = "submittedDate";
    const currentPagination: PaginationOptions = {
      page: 1,
      pageLimit: DEFAULT_PAGE_LIMIT,
      sortField: DEFAULT_SORT_FIELD,
      sortOrder: DataTableSortOrder.DESC,
    };

    const pageTitle = computed(() => {
      return props.appealsType === "legacy-change-request"
        ? "Pending change requests"
        : "Pending appeals";
    });

    const pageDescription = computed(() => {
      return props.appealsType === "legacy-change-request"
        ? "Change requests that require ministry review."
        : "Appeals that require ministry review.";
    });

    const gotToAssessmentsSummary = (
      applicationId: number,
      studentId: number,
    ) => {
      router.push({
        name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
        params: {
          applicationId: applicationId,
          studentId: studentId,
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
              appealType: props.appealsType,
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
        currentPagination.sortOrder = DataTableSortOrder.DESC;
      }
      await loadAppeals();
    };

    onMounted(async () => {
      await loadAppeals();
    });

    return {
      gotToAssessmentsSummary,
      applicationAppeals,
      dateOnlyLongString,
      emptyStringFiller,
      isLoading,
      PendingChangeRequestsTableHeaders,
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      searchAppeals,
      pageSortEvent,
      searchCriteria,
      pageTitle,
      pageDescription,
      currentPagination,
    };
  },
});
</script>
