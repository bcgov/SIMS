<template>
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
  DEFAULT_DATATABLE_PAGE_NUMBER,
} from "@/types";
import { useFormatters } from "@/composables";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { StudentAppealPendingSummaryAPIOutDTO } from "@/services/http/dto/StudentAppeal.dto";
import { StudentAppealService } from "@/services/StudentAppealService";

const DEFAULT_SORT_FIELD = "submittedDate";

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
    const isLoading = ref(false);
    const searchCriteria = ref("");
    const applicationAppeals = ref(
      {} as PaginatedResults<StudentAppealPendingSummaryAPIOutDTO>,
    );

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

    const loadAppeals = async (
      page = DEFAULT_DATATABLE_PAGE_NUMBER,
      pageLimit = DEFAULT_PAGE_LIMIT,
      inputSortField?: string,
      inputSortOrder?: DataTableSortOrder,
    ) => {
      try {
        isLoading.value = true;
        applicationAppeals.value =
          await StudentAppealService.shared.getPendingAppeals({
            page,
            pageLimit,
            sortField: inputSortField,
            sortOrder: inputSortOrder,
            searchCriteria: {
              appealType: props.appealsType,
              searchCriteria: searchCriteria.value,
            },
          });
      } catch (error: unknown) {
        console.error("Error loading appeals:", error);
        applicationAppeals.value = { results: [], count: 0 };
      } finally {
        isLoading.value = false;
      }
    };

    const searchAppeals = async () => {
      await loadAppeals();
    };

    const paginationAndSortEvent = async (options: any) => {
      const { page: currentPage, itemsPerPage, sortBy } = options;
      const [sortByOptions] = sortBy || [];

      await loadAppeals(
        currentPage,
        itemsPerPage,
        sortByOptions?.key,
        sortByOptions?.order === "desc"
          ? DataTableSortOrder.DESC
          : DataTableSortOrder.ASC,
      );
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
      tableHeaders,
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      searchAppeals,
      paginationAndSortEvent,
      searchCriteria,
      pageTitle,
      pageDescription,
    };
  },
});
</script>
