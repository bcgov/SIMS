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
} from "@/types";
import { useFormatters } from "@/composables";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { StudentAppealPendingSummaryAPIOutDTO } from "@/services/http/dto/StudentAppeal.dto";
import { StudentAppealService } from "@/services/StudentAppealService";

const DEFAULT_SORT_FIELD = "submittedDate";

// Table headers for Vuetify data table
const TABLE_HEADERS = [
  {
    title: "Date submitted",
    key: "submittedDate",
    sortable: true,
  },
  {
    title: "Given names",
    key: "firstName",
    sortable: false,
  },
  {
    title: "Last name",
    key: "lastName",
    sortable: true,
  },
  {
    title: "Application #",
    key: "applicationNumber",
    sortable: true,
  },
  {
    title: "Action",
    key: "action",
    sortable: false,
  },
];

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

    const tableHeaders = computed(() => TABLE_HEADERS);

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
     * Filter appeals based on the type.
     * For change-requests: show appeals submitted before 2025 (legacy change requests)
     * For appeals: show appeals submitted in 2025 or later (new appeals system)
     */
    const filterAppealsByType = (
      appeals: StudentAppealPendingSummaryAPIOutDTO[],
    ): StudentAppealPendingSummaryAPIOutDTO[] => {
      return appeals.filter((appeal) => {
        const submittedYear = new Date(appeal.submittedDate).getFullYear();

        if (props.appealsType === "change-requests") {
          // Show appeals submitted before 2025 (Pre 2025-2026)
          return submittedYear < 2025;
        } else {
          // Show appeals submitted in 2025 or later (2025-2026 and later)
          return submittedYear >= 2025;
        }
      });
    };

    const getAppealList = async () => {
      isLoading.value = true;
      try {
        const allAppeals = await StudentAppealService.shared.getPendingAppeals({
          page: DEFAULT_PAGE_NUMBER,
          pageLimit: DEFAULT_PAGE_LIMIT,
          sortField: DEFAULT_SORT_FIELD,
          sortOrder: DataTableSortOrder.ASC,
          searchCriteria: searchCriteria.value,
        });

        // Filter the results based on the appeals type
        const filteredResults = filterAppealsByType(allAppeals.results);

        applicationAppeals.value = {
          ...allAppeals,
          results: filteredResults,
          count: filteredResults.length,
        };
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

        const allAppeals = await StudentAppealService.shared.getPendingAppeals({
          page: page,
          pageLimit: itemsPerPage,
          sortField: sortField,
          sortOrder: sortOrder,
          searchCriteria: searchCriteria.value,
        });

        // Filter the results based on the appeals type
        const filteredResults = filterAppealsByType(allAppeals.results);

        applicationAppeals.value = {
          ...allAppeals,
          results: filteredResults,
          count: filteredResults.length,
        };
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
