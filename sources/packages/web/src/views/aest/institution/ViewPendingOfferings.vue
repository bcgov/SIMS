<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator title="Institution requests" sub-title="Offerings" />
    </template>
    <body-header title="Pending offerings" :records-count="offerings?.count">
      <template #subtitle>
        Offering requests that require Ministry review.
      </template>
      <template #actions>
        <v-text-field
          density="compact"
          label="Search Offering Name"
          variant="outlined"
          v-model="searchCriteria"
          @keyup.enter="searchOfferings"
          prepend-inner-icon="mdi-magnify"
          hide-details="auto"
        >
        </v-text-field>
      </template>
    </body-header>
    <content-group>
      <toggle-content :toggled="!offerings?.count">
        <v-data-table-server
          :headers="PendingOfferingsHeaders"
          :items="offerings?.results"
          :items-length="offerings?.count"
          :loading="loading"
          item-value="id"
          v-model:items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          :mobile="isMobile"
          @update:options="paginationAndSortEvent"
        >
          <template #[`item.submittedDate`]="{ item }">
            {{ dateOnlyLongString(item.submittedDate) }}
          </template>
          <template #[`item.locationName`]="{ item }">
            {{ item.locationName }}
          </template>
          <template #[`item.programName`]="{ item }">
            {{ item.programName }}
          </template>
          <template #[`item.name`]="{ item }">
            {{ item.name }}
          </template>
          <template #[`item.studyDates`]="{ item }">
            {{
              dateOnlyLongPeriodString(item.studyStartDate, item.studyEndDate)
            }}
          </template>
          <template #[`item.offeringStatus`]="{ item }">
            <status-chip-offering :status="item.offeringStatus" />
          </template>
          <template #[`item.actions`]="{ item }">
            <v-btn color="primary" @click="viewOffering(item)">View</v-btn>
          </template>
        </v-data-table-server>
      </toggle-content>
    </content-group>
  </full-page-container>
</template>

<script lang="ts">
import { useFormatters } from "@/composables";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import router from "@/router";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { EducationProgramOfferingPendingAPIOutDTO } from "@/services/http/dto";
import StatusChipOffering from "@/components/generic/StatusChipOffering.vue";
import {
  PaginatedResults,
  DEFAULT_DATATABLE_PAGE_NUMBER,
  DEFAULT_PAGE_LIMIT,
  DataTableSortByOrder,
  DataTableOptions,
  ITEMS_PER_PAGE,
  PendingOfferingsHeaders,
} from "@/types";
import { defineComponent, onMounted, ref } from "vue";
import { useDisplay } from "vuetify";

export default defineComponent({
  components: {
    StatusChipOffering,
  },
  setup() {
    const loading = ref(false);
    const searchCriteria = ref("");
    const { dateOnlyLongString, dateOnlyLongPeriodString } = useFormatters();
    const offerings = ref(
      {} as PaginatedResults<EducationProgramOfferingPendingAPIOutDTO>,
    );
    const { mobile: isMobile } = useDisplay();
    let currentPage = DEFAULT_DATATABLE_PAGE_NUMBER;
    let currentPageLimit = DEFAULT_PAGE_LIMIT;

    /**
     * Load pending offerings.
     * @param page page number, if nothing passed then {@link DEFAULT_DATATABLE_PAGE_NUMBER}.
     * @param pageCount page limit, if nothing passed then {@link DEFAULT_PAGE_LIMIT}.
     * @param sortField sort field, if nothing passed then api sorts with status.
     * @param sortOrder sort oder, if nothing passed then {@link DataTableSortByOrder.DESC}.
     */
    const getOfferings = async (
      page = DEFAULT_DATATABLE_PAGE_NUMBER,
      pageCount = DEFAULT_PAGE_LIMIT,
      sortField?: string,
      sortOrder?: DataTableSortByOrder,
    ) => {
      loading.value = true;
      offerings.value =
        await EducationProgramOfferingService.shared.getPendingOfferings({
          page,
          sortField,
          sortOrder,
          pageLimit: pageCount,
          searchCriteria: searchCriteria.value,
        });
      loading.value = false;
    };

    onMounted(async () => {
      await getOfferings();
    });

    // Pagination sort event callback.
    const paginationAndSortEvent = async (event: DataTableOptions) => {
      currentPage = event.page;
      currentPageLimit = event.itemsPerPage;
      const [sortByOptions] = event.sortBy;
      await getOfferings(
        event.page,
        event.itemsPerPage,
        sortByOptions?.key,
        sortByOptions?.order,
      );
    };

    // Search table.
    const searchOfferings = async () => {
      await getOfferings(
        currentPage ?? DEFAULT_DATATABLE_PAGE_NUMBER,
        currentPageLimit ?? DEFAULT_PAGE_LIMIT,
      );
    };

    /**
     * Navigate to View the Offering.
     * @param item the selected Offering.
     */
    const viewOffering = (item: EducationProgramOfferingPendingAPIOutDTO) => {
      router.push({
        name: AESTRoutesConst.VIEW_OFFERING,
        params: {
          offeringId: item.id,
          programId: item.programId,
          locationId: item.locationId,
          institutionId: item.institutionId,
        },
      });
    };

    return {
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      PendingOfferingsHeaders,
      dateOnlyLongString,
      dateOnlyLongPeriodString,
      paginationAndSortEvent,
      offerings,
      loading,
      searchCriteria,
      searchOfferings,
      viewOffering,
      isMobile,
    };
  },
});
</script>
