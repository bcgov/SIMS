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
      </template>
      <content-group>
        <toggle-content :toggled="!applications?.count">
          <v-data-table-server
            v-if="applications?.count"
            :headers="InProgressOfferingChangeSummaryHeaders"
            :items="applications?.results"
            :items-length="applications?.count"
            :loading="loading"
            item-value="id"
            :items-per-page="DEFAULT_PAGE_LIMIT"
            :items-per-page-options="ITEMS_PER_PAGE"
            @update:options="paginationAndSortEvent"
          >
            <template #[`item.fullName`]="{ item }">
              {{ item.fullName }}
            </template>
            <template #[`item.studyStartDate`]="{ item }">
              {{ dateOnlyLongString(item.studyStartDate) }}
              -
              {{ dateOnlyLongString(item.studyEndDate) }}
            </template>
            <template #[`item.applicationNumber`]="{ item }">
              {{ item.applicationNumber }} </template
            ><template #[`item.status`]="{ item }">
              <status-chip-application-offering-change :status="item.status" />
            </template>
            <template #[`item.id`]="{ item }">
              <v-btn color="primary" @click="viewRequestAChange(item.id)"
                >View</v-btn
              >
            </template>
          </v-data-table-server>
        </toggle-content>
      </content-group>
    </body-header-container>
  </tab-container>
</template>

<script lang="ts">
import { ref, watch, defineComponent } from "vue";
import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  DataTableOptions,
  PaginatedResults,
  InProgressOfferingChangeSummaryHeaders,
  DataTableSortByOrder,
  DEFAULT_DATATABLE_PAGE_NUMBER,
} from "@/types";
import { useFormatters } from "@/composables";
import { InProgressApplicationOfferingChangesAPIOutDTO } from "@/services/http/dto";
import { ApplicationOfferingChangeRequestService } from "@/services/ApplicationOfferingChangeRequestService";
import StatusChipApplicationOfferingChange from "@/components/generic/StatusChipApplicationOfferingChange.vue";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";

export default defineComponent({
  components: { StatusChipApplicationOfferingChange },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const loading = ref(false);
    const searchCriteria = ref("");
    const { dateOnlyLongString } = useFormatters();
    const applications = ref(
      {} as
        | PaginatedResults<InProgressApplicationOfferingChangesAPIOutDTO>
        | undefined,
    );
    let currentPage = NaN;
    let currentPageLimit = NaN;

    /**
     * Load in progress applications offering change records for institution.
     * @param page page number, if nothing passed then {@link DEFAULT_DATATABLE_PAGE_NUMBER}.
     * @param pageCount page limit, if nothing passed then {@link DEFAULT_PAGE_LIMIT}.
     * @param sortField sort field, if nothing passed then api sorts with application number.
     * @param sortOrder sort oder, if nothing passed then {@link DataTableSortByOrder.ASC}.
     */
    const getInProgressSummaryList = async (
      page = DEFAULT_DATATABLE_PAGE_NUMBER,
      pageCount = DEFAULT_PAGE_LIMIT,
      sortField?: string,
      sortOrder?: DataTableSortByOrder,
    ) => {
      loading.value = true;
      applications.value =
        await ApplicationOfferingChangeRequestService.shared.getInProgressApplications(
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
      await getInProgressSummaryList(
        event.page,
        event.itemsPerPage,
        sortByOptions?.key,
        sortByOptions?.order,
      );
    };

    // Search table.
    const searchApplicationOfferingChangeRecords = async () => {
      // When search is happening in a page other than the first page,
      // There is an unexpected behavior, probably which can be
      // fixed in the stable vuetify version.
      // Below is the fix for the search pagination issue.
      applications.value = undefined;
      await getInProgressSummaryList(
        currentPage ?? DEFAULT_DATATABLE_PAGE_NUMBER,
        currentPageLimit ?? DEFAULT_PAGE_LIMIT,
      );
    };

    /**
     * Navigate to the form to view a previously created request.
     * @param applicationOfferingChangeRequestId request id.
     */
    const viewRequestAChange = (id: any) => {
      router.push({
        name: InstitutionRoutesConst.REQUEST_CHANGE_FORM_VIEW,
        params: {
          locationId: props.locationId,
          applicationOfferingChangeRequestId: id,
        },
      });
    };

    watch(
      () => props.locationId,
      async () => {
        // Update the list.
        await getInProgressSummaryList();
      },
      { immediate: true },
    );

    return {
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      applications,
      dateOnlyLongString,
      paginationAndSortEvent,
      searchApplicationOfferingChangeRecords,
      searchCriteria,
      InProgressOfferingChangeSummaryHeaders,
      loading,
      viewRequestAChange,
    };
  },
});
</script>
