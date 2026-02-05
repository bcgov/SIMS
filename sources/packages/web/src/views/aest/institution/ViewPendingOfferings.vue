<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator title="Institution requests" sub-title="Offerings" />
    </template>
    <body-header
      title="Pending offerings"
      :records-count="offeringsAndCount?.count"
    >
      <template #subtitle>
        Offering requests that require Ministry review.
      </template>
      <template #actions>
        <v-text-field
          density="compact"
          label="Search offering name"
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
      <toggle-content :toggled="!offeringsAndCount?.count && !loading">
        <v-data-table-server
          :headers="PendingOfferingsHeaders"
          :items="offeringsAndCount?.results"
          :items-length="offeringsAndCount?.count"
          :loading="loading"
          item-value="id"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          :mobile="isMobile"
          @update:options="pageSortEvent"
        >
          <template #loading>
            <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
          </template>
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
          <template #[`item.offeringIntensity`]="{ item }">
            {{ mapOfferingIntensity(item.offeringIntensity) }}
          </template>
          <template #[`item.offeringType`]="{ item }">
            {{ item.offeringType }}
          </template>
          <template #[`item.offeringDelivered`]="{ item }">
            {{ capitalizeFirstWord(item.offeringDelivered) }}
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
import { useFormatters, useSnackBar } from "@/composables";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import router from "@/router";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { EducationProgramOfferingPendingAPIOutDTO } from "@/services/http/dto";
import {
  PaginatedResults,
  DEFAULT_DATATABLE_PAGE_NUMBER,
  DEFAULT_PAGE_LIMIT,
  DataTableSortByOrder,
  DataTableOptions,
  ITEMS_PER_PAGE,
  PendingOfferingsHeaders,
  PaginationOptions,
} from "@/types";
import { defineComponent, onMounted, ref } from "vue";
import { useDisplay } from "vuetify";
import { useOffering } from "@/composables/useOffering";

const DEFAULT_SORT_FIELD = "submittedDate";

export default defineComponent({
  setup() {
    const loading = ref(false);
    const searchCriteria = ref("");
    const {
      capitalizeFirstWord,
      dateOnlyLongString,
      dateOnlyLongPeriodString,
    } = useFormatters();
    const { mapOfferingIntensity } = useOffering();
    const { mobile: isMobile } = useDisplay();
    const snackBar = useSnackBar();

    const offeringsAndCount = ref(
      {} as PaginatedResults<EducationProgramOfferingPendingAPIOutDTO>,
    );

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
     * Loads study period offerings for the Institution Program.
     */
    const getOfferings = async () => {
      try {
        loading.value = true;
        offeringsAndCount.value =
          await EducationProgramOfferingService.shared.getPendingOfferings({
            searchCriteria: searchCriteria.value,
            ...currentPagination,
          });
      } catch {
        snackBar.error("Unexpected error while loading Offerings.");
      } finally {
        loading.value = false;
      }
    };

    onMounted(async () => {
      await getOfferings();
    });

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
      await getOfferings();
    };

    // Search offering table.
    const searchOfferings = async () => {
      await getOfferings();
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
      pageSortEvent,
      offeringsAndCount,
      loading,
      searchCriteria,
      searchOfferings,
      viewOffering,
      isMobile,
      mapOfferingIntensity,
      capitalizeFirstWord,
    };
  },
});
</script>
