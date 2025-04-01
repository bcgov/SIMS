<template>
  <full-page-container
    :full-width="true"
    :layout-template="LayoutTemplates.Centered"
  >
    <template #header>
      <header-navigator
        :title="locationName"
        subTitle="Program Information Requests"
        data-cy="programInformationRequestsHeader"
      />
    </template>
    <body-header-container :enableCardView="true">
      <template #header>
        <body-header
          title="Active applications"
          data-cy="activeApplicationsTab"
          :recordsCount="paginatedApplications.count"
        >
          <template #actions>
            <v-row align="center" justify="end" no-gutters>
              <v-col cols="auto" class="mr-4">
                <v-btn-toggle
                  mandatory
                  v-model="intensityFilter"
                  class="float-right btn-toggle"
                  selected-class="selected-btn-toggle"
                  @update:model-value="filterByIntensity"
                >
                  <v-btn
                    rounded="xl"
                    color="primary"
                    :value="IntensityFilter.All"
                    class="mr-2"
                    >All</v-btn
                  >
                  <v-btn
                    v-for="intensity in StudyIntensity"
                    :key="intensity"
                    rounded="xl"
                    color="primary"
                    :value="intensity"
                    class="mr-2"
                    >{{ intensity }}</v-btn
                  >
                </v-btn-toggle>
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model="searchQuery"
                  append-inner-icon="mdi-magnify"
                  placeholder="Search"
                  variant="outlined"
                  density="compact"
                  class="search-field"
                  hide-details
                  clearable
                  @update:model-value="handleSearch"
                  @click:clear="handleSearch"
                ></v-text-field>
              </v-col>
            </v-row>
          </template>
        </body-header>
      </template>
      <content-group>
        <toggle-content
          :toggled="!paginatedApplications.count && !applicationsLoading"
        >
          <v-data-table-server
            :headers="pirTableHeaders"
            :items="paginatedApplications.results"
            :items-length="paginatedApplications.count"
            :items-per-page="DEFAULT_PAGE_LIMIT"
            :items-per-page-options="ITEMS_PER_PAGE"
            :loading="applicationsLoading"
            @update:options="pageSortEvent"
          >
            <template #[`item.submittedDate`]="{ item }">
              {{ dateOnlyLongString(item.submittedDate) }}
            </template>
            <template #[`item.studyStartPeriod`]="{ item }">
              {{ dateOnlyLongString(item.studyStartPeriod) }}
            </template>
            <template #[`item.studyEndPeriod`]="{ item }">
              {{ dateOnlyLongString(item.studyEndPeriod) }}
            </template>
            <template #[`item.pirStatus`]="{ item }">
              <status-chip-program-info-request :status="item.pirStatus" />
            </template>
            <template #[`item.actions`]="{ item }">
              <v-btn
                color="primary"
                @click="goToViewApplication(item.applicationId)"
                >View</v-btn
              >
            </template>
          </v-data-table-server>
        </toggle-content>
      </content-group>
    </body-header-container>
  </full-page-container>
</template>

<script lang="ts">
import { onMounted, ref, watch, computed, defineComponent } from "vue";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { ProgramInfoRequestService } from "@/services/ProgramInfoRequestService";
import { useFormatters, useInstitutionState } from "@/composables";
import StatusChipProgramInfoRequest from "@/components/generic/StatusChipProgramInfoRequest.vue";
import {
  PIRSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import {
  DataTableOptions,
  DataTableSortOrder,
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  LayoutTemplates,
  PaginationOptions,
} from "@/types";

// Define study intensity enum since it's not exported from types
enum StudyIntensity {
  FullTime = "Full Time",
  PartTime = "Part Time",
}

const pirTableHeaders = [
  { title: "Submitted Date", key: "submittedDate", sortable: true },
  { title: "Application #", key: "applicationNumber", sortable: true },
  { title: "Given Names", key: "givenNames", sortable: true },
  { title: "Last Name", key: "lastName", sortable: true },
  { title: "Student Number", key: "studentNumber", sortable: true },
  { title: "Intensity", key: "studyIntensity", sortable: true },
  { title: "Program", key: "program", sortable: true },
  { title: "Start Date", key: "studyStartPeriod", sortable: true },
  { title: "End Date", key: "studyEndPeriod", sortable: true },
  { title: "Status", key: "pirStatus", sortable: true },
  { title: "Actions", key: "actions", sortable: false },
];

const IntensityFilter = {
  All: "All",
  ...StudyIntensity,
};

const DEFAULT_SORT_FIELD = "submittedDate";

export default defineComponent({
  components: { StatusChipProgramInfoRequest },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const { getLocationName } = useInstitutionState();
    const router = useRouter();
    const { dateOnlyLongString } = useFormatters();
    const applicationsLoading = ref(false);
    const searchQuery = ref("");
    const intensityFilter = ref([IntensityFilter.All]);
    const paginatedApplications = ref(
      {} as PaginatedResultsAPIOutDTO<PIRSummaryAPIOutDTO>,
    );

    const locationName = computed(() => {
      return getLocationName(props.locationId);
    });

    const currentPagination: PaginationOptions = {
      page: 1,
      pageLimit: DEFAULT_PAGE_LIMIT,
      sortField: DEFAULT_SORT_FIELD,
      sortOrder: DataTableSortOrder.DESC,
    };

    const goToViewApplication = (applicationId: number) => {
      router.push({
        name: InstitutionRoutesConst.PROGRAM_INFO_REQUEST_EDIT,
        params: { locationId: props.locationId, applicationId },
      });
    };

    const loadApplications = async () => {
      try {
        applicationsLoading.value = true;
        const response = await ProgramInfoRequestService.shared.getPIRSummary(
          props.locationId,
        );

        paginatedApplications.value = {
          results: response,
          count: response.length,
        };
      } catch (error: unknown) {
        console.error("Error loading PIR applications:", error);
      } finally {
        applicationsLoading.value = false;
      }
    };

    const handleSearch = async () => {
      let searchCriteria: Record<string, string | boolean | string[]> =
        (currentPagination.searchCriteria as Record<
          string,
          string | boolean | string[]
        >) || {};

      if (searchQuery.value) {
        // Search across multiple fields
        searchCriteria.search = searchQuery.value;
        // Keep the intensity filter if it exists
        if (
          intensityFilter.value &&
          !intensityFilter.value.includes(IntensityFilter.All)
        ) {
          searchCriteria.intensitySearch = intensityFilter.value.toString();
        }
      } else {
        // Clear search but keep intensity filter if it exists
        delete searchCriteria.search;
        if (
          intensityFilter.value &&
          !intensityFilter.value.includes(IntensityFilter.All)
        ) {
          searchCriteria.intensitySearch = intensityFilter.value.toString();
        } else {
          // Clear all criteria if no search and no intensity filter
          searchCriteria = {};
        }
      }

      currentPagination.searchCriteria = searchCriteria;
      await loadApplications();
    };

    const filterByIntensity = async () => {
      let searchCriteria: Record<string, string | boolean | string[]> =
        (currentPagination.searchCriteria as Record<
          string,
          string | boolean | string[]
        >) || {};

      if (intensityFilter.value.includes(IntensityFilter.All)) {
        delete searchCriteria.intensitySearch;
        // If no search query, clear all criteria
        if (!searchQuery.value) {
          searchCriteria = {};
        }
      } else {
        searchCriteria.intensitySearch = intensityFilter.value.toString();
      }

      // Preserve search query if it exists
      if (searchQuery.value) {
        searchCriteria.search = searchQuery.value;
      }

      currentPagination.searchCriteria = searchCriteria;
      await loadApplications();
    };

    const pageSortEvent = async (event: DataTableOptions) => {
      currentPagination.page = event.page;
      currentPagination.pageLimit = event.itemsPerPage;
      if (event.sortBy.length) {
        const [sortBy] = event.sortBy;
        currentPagination.sortField = sortBy.key;
        currentPagination.sortOrder = sortBy.order;
      } else {
        currentPagination.sortField = DEFAULT_SORT_FIELD;
        currentPagination.sortOrder = DataTableSortOrder.DESC;
      }
      await loadApplications();
    };

    watch(
      () => props.locationId,
      async () => {
        await loadApplications();
      },
    );

    onMounted(async () => {
      await loadApplications();
    });

    return {
      paginatedApplications,
      dateOnlyLongString,
      goToViewApplication,
      locationName,
      pirTableHeaders,
      applicationsLoading,
      searchQuery,
      handleSearch,
      intensityFilter,
      filterByIntensity,
      IntensityFilter,
      StudyIntensity,
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      pageSortEvent,
      LayoutTemplates,
    };
  },
});
</script>
