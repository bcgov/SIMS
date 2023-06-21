<template>
  <tab-container>
    <body-header-container>
      <template #header>
        <body-header title="Applications" :recordsCount="applications?.count">
          <template #subtitle>
            Waiting for the student and StudentAid BC decision on the requested
            change
          </template>
          <template #actions>
            <v-text-field
              density="compact"
              label="Search name or application #"
              variant="outlined"
              v-model="searchCriteria"
              @keyup.enter="searchApplicationOfferingChangeRecords"
              prepend-inner-icon="mdi-magnify"
              hide-details="auto"
            >
            </v-text-field>
          </template>
        </body-header>
        <content-group>
          <toggle-content :toggled="!applications?.count">
            <v-data-table-server
              :headers="InprogressOfferingChangeSummaryHeaders"
              :items="applications?.results"
              :items-length="applications?.count"
              :loading="loading"
              v-model:items-per-page="DEFAULT_PAGE_LIMIT"
              @update:options="paginationAndSortEvent"
            >
              <template #[`item.fullName`]="{ item }">
                {{ item.columns.fullName }}
              </template>
              <template #[`item.studyStartPeriod`]="{ item }">
                {{ dateOnlyLongString(item.columns.studyStartPeriod) }}
                -
                {{ dateOnlyLongString(item.value.studyEndPeriod) }}
              </template>
              <template #[`item.applicationNumber`]="{ item }">
                {{ item.columns.applicationNumber }} </template
              ><template #[`item.status`]="{ item }">
                <status-chip-application-offering-change
                  :status="item.columns.status"
                />
              </template>
              <template #[`item.applicationId`]>
                <v-btn color="primary">View</v-btn>
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
import {
  DEFAULT_PAGE_LIMIT,
  DataTableOptions,
  PaginatedResults,
  InprogressOfferingChangeSummaryHeaders,
  DataTableSortByOrder,
  DEFAULT_DATATABLE_PAGE_NUMBER,
} from "@/types";
import { useFormatters } from "@/composables";
import { InprogressApplicationOfferingChangesAPIOutDTO } from "@/services/http/dto";
import { ApplicationOfferingChangeRequestService } from "@/services/ApplicationOfferingChangeRequestService";
import StatusChipApplicationOfferingChange from "@/components/generic/StatusChipApplicationOfferingChange.vue";

export default defineComponent({
  components: { StatusChipApplicationOfferingChange },
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
      {} as
        | PaginatedResults<InprogressApplicationOfferingChangesAPIOutDTO>
        | undefined,
    );
    let currentPage = NaN;
    let currentPageLimit = NaN;

    /**
     * Load inprogress applications offering change records for institution.
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
        await ApplicationOfferingChangeRequestService.shared.getInprogressApplications(
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
      // Fix for the search pagination issue.
      applications.value = undefined;
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
      InprogressOfferingChangeSummaryHeaders,
      loading,
    };
  },
});
</script>
