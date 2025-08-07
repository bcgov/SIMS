<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator title="Student requests" :subTitle="pageSubTitle" />
    </template>
    <body-header
      :title="pageTitle"
      :recordsCount="applicationAppeals.count"
      :subTitle="pageDescription"
    >
      <template #actions>
        <v-text-field
          density="compact"
          label="Search name or application #"
          variant="outlined"
          v-model="searchCriteria"
          @keyup.enter="resetPageAndLoadApplications"
          prepend-inner-icon="mdi-magnify"
          hide-details="auto"
        >
        </v-text-field>
      </template>
    </body-header>
    <content-group>
      <toggle-content :toggled="!applicationAppeals.count && !isLoading">
        <v-data-table-server
          :headers="tableHeaders"
          :items="applicationAppeals.results"
          :items-length="applicationAppeals.count"
          :loading="isLoading"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="PAGINATION_LIST"
          @update:options="paginationAndSortEvent"
        >
          <template v-slot:loading>
            <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
          </template>
          <template #[`item.submittedDate`]="{ item }">
            {{ dateOnlyLongString(item.submittedDate) }}
          </template>
          <template #[`item.firstName`]="{ item }">
            {{ emptyStringFiller(item.firstName) }}
          </template>
          <template #[`item.action`]="{ item }">
            <v-btn
              color="primary"
              @click="
                gotToAssessmentsSummary(item.applicationId, item.studentId)
              "
              >View</v-btn
            >
          </template>
        </v-data-table-server>
      </toggle-content>
    </content-group>
  </full-page-container>
</template>

<script lang="ts">
import { ref, onMounted, defineComponent, computed } from "vue";
import { useRouter } from "vue-router";
import {
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  DataTableSortOrder,
  DEFAULT_PAGE_NUMBER,
  PaginatedResults,
  PendingStudentRequestsTableHeaders,
} from "@/types";
import { useFormatters } from "@/composables";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { StudentAppealPendingSummaryAPIOutDTO } from "@/services/http/dto/StudentAppeal.dto";
import { StudentAppealService } from "@/services/StudentAppealService";

const DEFAULT_SORT_FIELD = "submittedDate";

// Interface for search criteria object
interface AppealSearchCriteria {
  appealsType: "change-requests" | "appeals";
  searchText: string;
}

export interface PendingAppealsTableProps {
  /**
   * Type of appeals to display: "change-requests" or "appeals"
   */
  appealsType: "change-requests" | "appeals";
}

export default defineComponent({
  props: {
    appealsType: {
      type: String as () => "change-requests" | "appeals",
      required: true,
      validator: (value: string) =>
        ["change-requests", "appeals"].includes(value),
    },
  },
  setup(props) {
    // Search criteria structure:
    // - appealsType: Filters appeals by year ("change-requests" for < 2025, "appeals" for >= 2025)
    // - searchText: User input for searching by name or application number
    // The backend expects this as a JSON string and will parse it accordingly
    const router = useRouter();
    const isLoading = ref(false);
    const searchCriteria = ref();
    const { dateOnlyLongString, emptyStringFiller } = useFormatters();
    const applicationAppeals = ref(
      {} as PaginatedResults<StudentAppealPendingSummaryAPIOutDTO>,
    );

    // Computed properties for dynamic content based on appeals type
    const pageSubTitle = computed(() => {
      return props.appealsType === "change-requests"
        ? "Change Requests (Pre 2025-2026)"
        : "Appeals (2025-2026 and later)";
    });

    const pageTitle = computed(() => {
      return props.appealsType === "change-requests"
        ? "Pending change requests"
        : "Pending appeals";
    });

    const pageDescription = computed(() => {
      return props.appealsType === "change-requests"
        ? "Change requests that require ministry review."
        : "Appeals that require ministry review.";
    });

    const tableHeaders = computed(() => PendingStudentRequestsTableHeaders);

    /**
     * Navigate to assessment summary page for the selected appeal
     */

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

    /**
     * Create search criteria object that includes appeals type and search text
     * @param searchText - Optional search text from user input
     * @returns JSON string containing search criteria
     */
    const createSearchCriteria = (searchText?: string): string => {
      const searchCriteria: AppealSearchCriteria = {
        appealsType: props.appealsType,
        searchText: searchText?.trim() || "",
      };
      return JSON.stringify(searchCriteria);
    };

    /**
     * Build pagination options with search criteria
     * @param options - Pagination and sort options
     * @returns Complete pagination options with search criteria
     */
    const buildPaginationOptions = (options: {
      page?: number;
      pageLimit?: number;
      sortField?: string;
      sortOrder?: DataTableSortOrder;
    }) => ({
      page: options.page ?? DEFAULT_PAGE_NUMBER,
      pageLimit: options.pageLimit ?? DEFAULT_PAGE_LIMIT,
      sortField: options.sortField ?? DEFAULT_SORT_FIELD,
      sortOrder: options.sortOrder ?? DataTableSortOrder.ASC,
      searchCriteria: createSearchCriteria(searchCriteria.value),
    });

    const getAppealList = async () => {
      isLoading.value = true;
      try {
        const paginationOptions = buildPaginationOptions({});
        const allAppeals = await StudentAppealService.shared.getPendingAppeals(
          paginationOptions,
        );

        applicationAppeals.value = allAppeals;
      } finally {
        isLoading.value = false;
      }
    };

    const paginationAndSortEvent = async (options: any) => {
      isLoading.value = true;
      try {
        const { page, itemsPerPage, sortBy } = options;
        const sortField = sortBy?.length ? sortBy[0].key : DEFAULT_SORT_FIELD;
        const sortOrder =
          sortBy?.length && sortBy[0].order === "desc"
            ? DataTableSortOrder.DESC
            : DataTableSortOrder.ASC;

        const paginationOptions = buildPaginationOptions({
          page,
          pageLimit: itemsPerPage,
          sortField,
          sortOrder,
        });

        const allAppeals = await StudentAppealService.shared.getPendingAppeals(
          paginationOptions,
        );

        applicationAppeals.value = allAppeals;
      } finally {
        isLoading.value = false;
      }
    };

    const resetPageAndLoadApplications = async () => {
      await getAppealList();
    };

    onMounted(async () => {
      await getAppealList();
    });

    return {
      gotToAssessmentsSummary,
      applicationAppeals,
      dateOnlyLongString,
      emptyStringFiller,
      isLoading,
      tableHeaders,
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      paginationAndSortEvent,
      resetPageAndLoadApplications,
      searchCriteria,
      pageSubTitle,
      pageTitle,
      pageDescription,
    };
  },
});
</script>
