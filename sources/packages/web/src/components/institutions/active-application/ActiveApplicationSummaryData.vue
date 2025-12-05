<template>
  <v-card class="mt-5">
    <v-container :fluid="true">
      <body-header
        title="Applications"
        :records-count="applicationsListAndCount.count"
      >
        <template #actions>
          <v-text-field
            density="compact"
            label="Search name or application #"
            variant="outlined"
            v-model="searchCriteria"
            data-cy="searchCriteria"
            @keyup.enter="searchActiveApplications"
            prepend-inner-icon="mdi-magnify"
            hide-details="auto"
          >
          </v-text-field>
        </template>
      </body-header>
      <content-group>
        <toggle-content
          :toggled="!applicationsListAndCount.count && !loading"
          message="No applications found."
        >
          <v-data-table-server
            v-if="applicationsListAndCount?.count"
            :headers="ReportAChangeApplicationsHeaders"
            :items="applicationsListAndCount?.results"
            :items-length="applicationsListAndCount?.count"
            :loading="loading"
            :items-per-page="DEFAULT_PAGE_LIMIT"
            :items-per-page-options="ITEMS_PER_PAGE"
            @update:options="pageSortEvent"
          >
            <template #loading>
              <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
            </template>
            <template #[`item.studyDates`]="{ item }">
              {{ dateOnlyLongString(item.studyStartPeriod) }} -
              {{ dateOnlyLongString(item.studyEndPeriod) }}
            </template>
            <template #[`item.applicationNumber`]="{ item }">
              {{ item.applicationNumber }}
            </template>
            <template #[`item.applicationStatus`]="{ item }">
              <status-chip-active-application
                :status="item.applicationScholasticStandingStatus"
              />
            </template>
            <template #[`item.action`]="{ item }">
              <v-btn
                v-if="
                  item.applicationScholasticStandingStatus ===
                  ApplicationScholasticStandingStatus.Available
                "
                color="primary"
                @click="goToViewApplication(item.applicationId)"
                >Report a change</v-btn
              >
              <v-btn
                v-if="
                  item.applicationScholasticStandingStatus ===
                    ApplicationScholasticStandingStatus.Completed &&
                  item.scholasticStandingId
                "
                color="primary"
                @click="goToViewScholasticStanding(item.scholasticStandingId)"
                >View</v-btn
              >
            </template>
          </v-data-table-server>
        </toggle-content>
      </content-group>
    </v-container>
  </v-card>
</template>

<script lang="ts">
import { ref, watch, defineComponent } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";

import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { InstitutionService } from "@/services/InstitutionService";
import {
  DEFAULT_PAGE_LIMIT,
  DEFAULT_DATATABLE_PAGE_NUMBER,
  PaginatedResults,
  ApplicationScholasticStandingStatus,
  LayoutTemplates,
  ReportAChangeApplicationsHeaders,
  DataTableOptions,
  DataTableSortByOrder,
  ITEMS_PER_PAGE,
  PaginationOptions,
} from "@/types";
import { ActiveApplicationSummaryAPIOutDTO } from "@/services/http/dto";
import { useFormatters, useSnackBar } from "@/composables";
import StatusChipActiveApplication from "@/components/generic/StatusChipActiveApplication.vue";

const DEFAULT_SORT_FIELD = "applicationNumber";

export default defineComponent({
  components: {
    StatusChipActiveApplication,
  },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
    archived: {
      type: Boolean,
      required: true,
    },
  },

  setup(props) {
    const router = useRouter();
    const searchCriteria = ref();
    const { dateOnlyLongString } = useFormatters();
    const { mobile: isMobile } = useDisplay();
    const applicationsListAndCount = ref(
      {} as PaginatedResults<ActiveApplicationSummaryAPIOutDTO>,
    );
    const loading = ref(false);
    const snackBar = useSnackBar();

    /**
     * Current state of the pagination.
     */
    const currentPagination: PaginationOptions = {
      page: DEFAULT_DATATABLE_PAGE_NUMBER,
      pageLimit: DEFAULT_PAGE_LIMIT,
      sortField: DEFAULT_SORT_FIELD,
      sortOrder: DataTableSortByOrder.ASC,
    };

    const goToViewApplication = (applicationId: number) => {
      router.push({
        name: InstitutionRoutesConst.ACTIVE_APPLICATION_EDIT,
        params: { locationId: props.locationId, applicationId },
      });
    };

    const goToViewScholasticStanding = (scholasticStandingId: number) => {
      router.push({
        name: InstitutionRoutesConst.SCHOLASTIC_STANDING_VIEW,
        params: { locationId: props.locationId, scholasticStandingId },
      });
    };

    /**
     * Loads Application Summaries for the given location.
     */
    const getApplicationSummaryList = async () => {
      loading.value = true;
      try {
        applicationsListAndCount.value =
          await InstitutionService.shared.getActiveApplicationsSummary(
            props.locationId,
            {
              ...currentPagination,
              searchCriteria: searchCriteria.value,
            },
            props.archived,
          );
      } catch {
        snackBar.error("Unexpected error while loading Applications.");
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
      await getApplicationSummaryList();
    };

    const searchActiveApplications = async () => {
      await getApplicationSummaryList();
    };

    watch(
      () => props.locationId,
      async () => {
        await getApplicationSummaryList();
      },
      { immediate: true },
    );

    return {
      ApplicationScholasticStandingStatus,
      applicationsListAndCount,
      dateOnlyLongString,
      goToViewApplication,
      pageSortEvent,
      searchActiveApplications,
      searchCriteria,
      goToViewScholasticStanding,
      LayoutTemplates,
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      loading,
      ReportAChangeApplicationsHeaders,
      isMobile,
    };
  },
});
</script>
