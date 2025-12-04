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
          :sort-by="sortBy"
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
} from "@/types";
import { useFormatters } from "@/composables";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { ApplicationExceptionSummaryAPIOutDTO } from "@/services/http/dto/ApplicationException.dto";

const DEFAULT_SORT_FIELD = "submittedDate";

export default defineComponent({
  setup() {
    const router = useRouter();
    const currentPage = ref();
    const currentPageLimit = ref();
    // Shows the default sort arrows in the data table.
    const sortBy = ref([
      { key: DEFAULT_SORT_FIELD, order: DataTableSortByOrder.ASC },
    ]);
    const searchCriteria = ref();
    const { dateOnlyLongString } = useFormatters();
    const applicationExceptions = ref(
      {} as PaginatedResults<ApplicationExceptionSummaryAPIOutDTO>,
    );
    const loading = ref(false);
    const { mobile: isMobile } = useDisplay();

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
     * Loads Pending Exception Requests.
     * @param page page number, if nothing passed then {@link DEFAULT_DATATABLE_PAGE_NUMBER}.
     * @param pageCount page limit, if nothing passed then {@link DEFAULT_PAGE_LIMIT}.
     * @param sortField sort field, if nothing passed then api sorts with application number.
     * @param sortOrder sort order, if nothing passed then {@link DataTableSortByOrder.ASC}.
     */
    const getExceptionList = async (
      page = DEFAULT_DATATABLE_PAGE_NUMBER,
      pageCount = DEFAULT_PAGE_LIMIT,
      sortField = DEFAULT_SORT_FIELD,
      sortOrder = DataTableSortByOrder.ASC,
    ) => {
      applicationExceptions.value =
        await ApplicationExceptionService.shared.getPendingExceptions({
          page,
          pageLimit: pageCount,
          sortField,
          sortOrder,
          searchCriteria: searchCriteria.value,
        });
    };

    const pageSortEvent = async (event: DataTableOptions) => {
      currentPage.value = event?.page;
      currentPageLimit.value = event.itemsPerPage;
      const [sortByOptions] = event.sortBy;
      await getExceptionList(
        event.page,
        event.itemsPerPage,
        sortByOptions?.key,
        sortByOptions?.order,
      );
    };

    const searchExceptions = async () => {
      // TODO: reset to first page on new search
      currentPage.value = DEFAULT_DATATABLE_PAGE_NUMBER;
      currentPageLimit.value = DEFAULT_PAGE_LIMIT;
      await getExceptionList(
        currentPage.value ?? DEFAULT_DATATABLE_PAGE_NUMBER,
        currentPageLimit.value ?? DEFAULT_PAGE_LIMIT,
      );
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
      sortBy,
      ExceptionRequestsHeaders,
      isMobile,
    };
  },
});
</script>
