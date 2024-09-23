<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator title="Institution requests" subTitle="Applications" />
    </template>
    <body-header
      title="Requested application changes"
      :recordsCount="applications?.count"
    >
      <template #subtitle>
        Make a determination on a requested change for a program and offering in
        an application.
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
          v-if="applications?.count"
          :headers="AllInProgressOfferingChangeSummaryHeaders"
          :items="applications?.results"
          :items-length="applications.count"
          :loading="loading"
          item-value="applicationId"
          v-model:items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          @update:options="paginationAndSortEvent"
        >
          <template #[`item.dateSubmitted`]="{ item }">
            {{ dateOnlyLongString(item.createdAt) }}
          </template>
          <template #[`item.fullName`]="{ item }">
            {{ item.fullName }}
          </template>
          <template #[`item.applicationNumber`]="{ item }">
            {{ item.applicationNumber }}
          </template>
          <template #[`item.status`]="{ item }">
            <status-chip-application-offering-change :status="item.status" />
          </template>
          <template #[`item.id`]="{ item }">
            <v-btn color="primary" @click="viewAssessment(item)">View</v-btn>
          </template>
        </v-data-table-server>
      </toggle-content>
    </content-group>
  </full-page-container>
</template>
<script lang="ts">
import { ref, defineComponent, onMounted } from "vue";
import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  DataTableOptions,
  PaginatedResults,
  AllInProgressOfferingChangeSummaryHeaders,
  DEFAULT_DATATABLE_PAGE_NUMBER,
  DataTableSortByOrder,
} from "@/types";
import { useFormatters } from "@/composables";
import StatusChipApplicationOfferingChange from "@/components/generic/StatusChipApplicationOfferingChange.vue";
import { AllInProgressApplicationOfferingChangesAPIOutDTO } from "@/services/http/dto";
import { ApplicationOfferingChangeRequestService } from "@/services/ApplicationOfferingChangeRequestService";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";

export default defineComponent({
  components: { StatusChipApplicationOfferingChange },
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const searchCriteria = ref("");
    const { dateOnlyLongString } = useFormatters();
    const applications = ref(
      {} as
        | PaginatedResults<AllInProgressApplicationOfferingChangesAPIOutDTO>
        | undefined,
    );
    let currentPage = DEFAULT_DATATABLE_PAGE_NUMBER;
    let currentPageLimit = DEFAULT_PAGE_LIMIT;

    /**
     * Load eligible applications offering change records.
     * @param page page number, if nothing passed then {@link DEFAULT_DATATABLE_PAGE_NUMBER}.
     * @param pageCount page limit, if nothing passed then {@link DEFAULT_PAGE_LIMIT}.
     * @param sortField sort field, if nothing passed then api sorts with status.
     * @param sortOrder sort oder, if nothing passed then {@link DataTableSortByOrder.DESC}.
     */
    const getSummaryList = async (
      page = DEFAULT_DATATABLE_PAGE_NUMBER,
      pageCount = DEFAULT_PAGE_LIMIT,
      sortField = "status",
      sortOrder = DataTableSortByOrder.DESC,
    ) => {
      loading.value = true;
      applications.value =
        await ApplicationOfferingChangeRequestService.shared.getAllInProgressApplications(
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

    onMounted(getSummaryList);

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

    /**
     * Navigate to the form to view assessment.
     * @param item item from data table.
     */
    const viewAssessment = (item: any) => {
      router.push({
        name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
        params: {
          applicationId: item.applicationId,
          studentId: item.studentId,
        },
      });
    };

    return {
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      applications,
      dateOnlyLongString,
      paginationAndSortEvent,
      searchApplicationOfferingChangeRecords,
      searchCriteria,
      AllInProgressOfferingChangeSummaryHeaders,
      loading,
      viewAssessment,
    };
  },
});
</script>
