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
  PendingChangeRequestsTableHeaders,
  PageAndSortEvent,
} from "@/types";
import { useFormatters } from "@/composables";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { StudentAppealPendingSummaryAPIOutDTO } from "@/services/http/dto/StudentAppeal.dto";
import { StudentAppealService } from "@/services/StudentAppealService";

const DEFAULT_SORT_FIELD = "submittedDate";

interface AppealSearchCriteria {
  appealsType: "change-requests" | "appeals";
  searchText: string;
}

export interface PendingAppealsTableProps {
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
    const page = ref(DEFAULT_PAGE_NUMBER);
    const pageLimit = ref(DEFAULT_PAGE_LIMIT);
    const sortField = ref(DEFAULT_SORT_FIELD);
    const sortOrder = ref(DataTableSortOrder.ASC);
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

    const tableHeaders = computed(() => PendingChangeRequestsTableHeaders);
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

    const createSearchCriteria = (searchText?: string): string => {
      const searchCriteria: AppealSearchCriteria = {
        appealsType: props.appealsType,
        searchText: searchText?.trim() || "",
      };
      return JSON.stringify(searchCriteria);
    };

    const getAppealList = async () => {
      isLoading.value = true;
      try {
        applicationAppeals.value =
          await StudentAppealService.shared.getPendingAppeals({
            page: page.value,
            pageLimit: pageLimit.value,
            sortField: sortField.value,
            sortOrder: sortOrder.value,
            searchCriteria: createSearchCriteria(searchCriteria.value),
          });
      } finally {
        isLoading.value = false;
      }
    };

    const pageEvent = async (event: PageAndSortEvent) => {
      page.value = event?.page;
      pageLimit.value = event?.rows;
      await getAppealList();
    };

    const sortEvent = async (event: PageAndSortEvent) => {
      page.value = DEFAULT_PAGE_NUMBER;
      pageLimit.value = DEFAULT_PAGE_LIMIT;
      sortField.value = event.sortField;
      sortOrder.value = event.sortOrder;
      await getAppealList();
    };

    const searchAppeals = async () => {
      page.value = DEFAULT_PAGE_NUMBER;
      pageLimit.value = DEFAULT_PAGE_LIMIT;
      await getAppealList();
    };

    const paginationAndSortEvent = async (options: any) => {
      const { page: currentPage, itemsPerPage, sortBy } = options;
      page.value = currentPage;
      pageLimit.value = itemsPerPage;

      if (sortBy?.length) {
        sortField.value = sortBy[0].key;
        sortOrder.value =
          sortBy[0].order === "desc"
            ? DataTableSortOrder.DESC
            : DataTableSortOrder.ASC;
      }

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
      pageEvent,
      sortEvent,
      searchAppeals,
      paginationAndSortEvent,
      searchCriteria,
      pageSubTitle,
      pageTitle,
      pageDescription,
    };
  },
});
</script>
