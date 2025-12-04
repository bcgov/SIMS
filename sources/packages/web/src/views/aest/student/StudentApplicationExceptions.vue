<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator title="Student requests" sub-title="Exceptions" />
    </template>
    <body-header
      title="Pending exception requests"
      :records-count="applicationExceptions.count"
      sub-title="Exception requests that require ministry review."
    >
      <template #actions>
        <v-text-field
          density="compact"
          label="Search name or application #"
          variant="outlined"
          v-model="searchCriteria"
          data-cy="searchExceptions"
          @keyup.enter="searchExceptions"
          prepend-inner-icon="mdi-magnify"
          hide-details="auto"
        >
        </v-text-field>
      </template>
    </body-header>
    <content-group>
      <toggle-content
        :toggled="!applicationExceptions.results?.length && !loading"
        message="No pending exception requests."
      >
        <v-data-table-server
          v-if="applicationExceptions?.count"
          :headers="ExceptionRequestsHeaders"
          :items="applicationExceptions?.results"
          :items-length="applicationExceptions?.count"
          :loading="loading"
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
          <template #[`item.givenNames`]="{ item }">
            {{ item.givenNames }}
          </template>
          <template #[`item.lastName`]="{ item }">
            {{ item.lastName }}
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
import { ref, onMounted, defineComponent } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";

import { ApplicationExceptionService } from "@/services/ApplicationExceptionService";
import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  DEFAULT_DATATABLE_PAGE_NUMBER,
  PaginatedResults,
  ExceptionRequestsHeaders,
  DataTableSortByOrder,
  DataTableOptions,
  PaginationOptions,
} from "@/types";
import { useFormatters, useSnackBar } from "@/composables";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { ApplicationExceptionSummaryAPIOutDTO } from "@/services/http/dto/ApplicationException.dto";

const DEFAULT_SORT_FIELD = "submittedDate";

export default defineComponent({
  setup() {
    const router = useRouter();
    const searchCriteria = ref();
    const { dateOnlyLongString } = useFormatters();
    const applicationExceptions = ref(
      {} as PaginatedResults<ApplicationExceptionSummaryAPIOutDTO>,
    );
    const loading = ref(false);
    const { mobile: isMobile } = useDisplay();
    const snackBar = useSnackBar();

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
     * Current state of the pagination.
     */
    const currentPagination: PaginationOptions = {
      page: DEFAULT_DATATABLE_PAGE_NUMBER,
      pageLimit: DEFAULT_PAGE_LIMIT,
      sortField: DEFAULT_SORT_FIELD,
      sortOrder: DataTableSortByOrder.ASC,
    };

    /**
     * Loads Pending Exception Requests.
     */
    const getExceptionList = async () => {
      try {
        loading.value = true;
        applicationExceptions.value =
          await ApplicationExceptionService.shared.getPendingExceptions(
            currentPagination,
          );
      } catch {
        snackBar.error("Unexpected error while loading Exceptions.");
      } finally {
        loading.value = false;
      }
    };

    /**
     * Page/Sort event handler.
     * @param event The data table page/sort event.
     */
    const pageSortEvent = async (event: DataTableOptions) => {
      currentPagination.page = event.page;
      currentPagination.pageLimit = event.itemsPerPage;
      if (event.sortBy.length) {
        const [sortBy] = event.sortBy;
        currentPagination.sortField = sortBy.key;
        currentPagination.sortOrder = sortBy.order;
      } else {
        // Sorting was removed, reset to default.
        currentPagination.sortField = DEFAULT_SORT_FIELD;
        currentPagination.sortOrder = DataTableSortByOrder.ASC;
      }
      await getExceptionList();
    };

    const searchExceptions = async () => {
      await getExceptionList();
    };

    onMounted(async () => {
      await getExceptionList();
    });

    return {
      gotToAssessmentsSummary,
      applicationExceptions,
      dateOnlyLongString,
      pageSortEvent,
      searchExceptions,
      searchCriteria,
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      loading,
      ExceptionRequestsHeaders,
      isMobile,
    };
  },
});
</script>
