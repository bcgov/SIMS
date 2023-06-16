<template>
  <tab-container>
    <body-header-container>
      <template #header>
        <body-header title="Applications" :recordsCount="applications.count">
          <template #subtitle>
            Request a change for a program and offering in an application
            <tooltip-icon
              >Only "completed" applications can be requested to change. For
              applications that are in progress, please have the student edit
              their application from their account. If the student has received
              funding already, the student will need to "request a change" from
              their account.</tooltip-icon
            >
          </template>
          <template #actions>
            <v-text-field
              density="compact"
              label="Search name or application #"
              variant="outlined"
              v-model="searchCriteria"
              data-cy="searchCriteria"
              @keyup.enter="searchApplicationOfferingChangeRecords"
              prepend-inner-icon="mdi-magnify"
              hide-details="auto"
            >
            </v-text-field>
          </template>
        </body-header>
        <content-group>
          <toggle-content :toggled="!applications.count">
            <v-data-table-server
              :headers="AvailableToChangeOfferingChangeSummaryHeaders"
              :items="applications.results"
              :items-length="applications.count"
              :loading="loading"
              :items-per-page="DEFAULT_PAGE_LIMIT"
              @update:options="paginationAndSortEvent"
            >
              <template #[`item.fullName`]="{ item }">
                <span data-cy="fullName">{{ item.columns.fullName }} </span>
              </template>
              <template #[`item.studyStartPeriod`]="{ item }">
                <span data-cy="studyStartPeriod">
                  {{ dateOnlyLongString(item.columns.studyStartPeriod) }}
                  -
                  {{ dateOnlyLongString(item.value.studyEndPeriod) }}
                </span>
              </template>
              <template #[`item.applicationNumber`]="{ item }">
                <span data-cy="applicationNumber"
                  >{{ item.columns.applicationNumber }}
                </span>
              </template>
              <template #[`item.applicationId`]>
                <v-btn data-cy="applicationId" color="primary"
                  >Request a change</v-btn
                >
              </template>
            </v-data-table-server>
          </toggle-content>
        </content-group>
      </template>
    </body-header-container>
  </tab-container>
</template>

<script lang="ts">
import { ref, watch, defineComponent } from "vue";
import { InstitutionService } from "@/services/InstitutionService";
import {
  DEFAULT_PAGE_LIMIT,
  DataTableOptions,
  PaginatedResults,
  AvailableToChangeOfferingChangeSummaryHeaders,
  DataTableSortByOrder,
  DEFAULT_DATATABLE_PAGE_NUMBER,
} from "@/types";
import { ApplicationOfferingChangeSummaryAPIOutDTO } from "@/services/http/dto";
import { useFormatters } from "@/composables";

export default defineComponent({
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const loading = ref(false);
    const searchCriteria = ref("");
    const { dateOnlyLongString } = useFormatters();
    const applications = ref(
      {} as PaginatedResults<ApplicationOfferingChangeSummaryAPIOutDTO>,
    );
    let currentPage = NaN;
    let currentPageLimit = NaN;

    /**
     * Load eligible application offering change records for institution.
     * @param page page number, if nothing passed then {@link DEFAULT_DATATABLE_PAGE_NUMBER}.
     * @param pageCount page limit, if nothing passed then {@link DEFAULT_PAGE_LIMIT}.
     * @param sortField sort field, if nothing passed then api sorts with application number.
     * @param sortOrder sort oder, if nothing passed then {@link DataTableSortByOrder.ASC}.
     */
    const getSummaryList = async (
      page = DEFAULT_DATATABLE_PAGE_NUMBER,
      pageCount = DEFAULT_PAGE_LIMIT,
      sortField?: string,
      sortOrder?: DataTableSortByOrder,
    ) => {
      loading.value = true;
      applications.value =
        await InstitutionService.shared.getEligibleApplicationOfferingChangeRecords(
          props.locationId,
          {
            page,
            sortField,
            sortOrder,
            pageLimit: pageCount,
            searchCriteria: searchCriteria.value,
          },
        );
      loading.value = false;
    };

    // Pagination sort event callback.
    const paginationAndSortEvent = async (event: DataTableOptions) => {
      currentPage = event.page;
      currentPageLimit = event.itemsPerPage;
      const [sortByOptions] = event.sortBy;
      await getSummaryList(
        event.page,
        event.itemsPerPage,
        sortByOptions?.key,
        sortByOptions?.order,
      );
    };

    // Search table.
    const searchApplicationOfferingChangeRecords = async () => {
      await getSummaryList(
        currentPage ?? DEFAULT_DATATABLE_PAGE_NUMBER,
        currentPageLimit ?? DEFAULT_PAGE_LIMIT,
      );
    };

    watch(
      () => props.locationId,
      async () => {
        // Update the list.
        await getSummaryList();
      },
      { immediate: true },
    );

    return {
      DEFAULT_PAGE_LIMIT,
      applications,
      dateOnlyLongString,
      paginationAndSortEvent,
      searchApplicationOfferingChangeRecords,
      searchCriteria,
      AvailableToChangeOfferingChangeSummaryHeaders,
      loading,
    };
  },
});
</script>
