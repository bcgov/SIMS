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
    <body-header-container>
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
  { title: "Application #", key: "applicationNumber", sortable: false },
  { title: "Given Names", key: "givenNames", sortable: false },
  { title: "Last Name", key: "lastName", sortable: false },
  { title: "Student Number", key: "studentNumber", sortable: false },
  { title: "Intensity", key: "studyIntensity", sortable: false },
  { title: "Program", key: "program", sortable: false },
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

        // Sort the results to show Pending first and then by Submitted date
        const sortedResults = response.sort((a, b) => {
          // First sort by status (Pending first)
          if (a.pirStatus === "Required" && b.pirStatus !== "Required")
            return -1;
          if (a.pirStatus !== "Required" && b.pirStatus === "Required")
            return 1;

          // Then sort by submitted date
          return (
            new Date(b.submittedDate).getTime() -
            new Date(a.submittedDate).getTime()
          );
        });

        paginatedApplications.value = {
          results: sortedResults,
          count: sortedResults.length,
        };
      } catch (error: unknown) {
        console.error("Error loading PIR applications:", error);
      } finally {
        applicationsLoading.value = false;
      }
    };

    const handleSearch = async () => {
      try {
        applicationsLoading.value = true;
        const response = await ProgramInfoRequestService.shared.getPIRSummary(
          props.locationId,
        );

        // Filter results based on search query and intensity filter
        let filteredResults = response;

        if (searchQuery.value) {
          const searchLower = searchQuery.value.toLowerCase();
          filteredResults = filteredResults.filter(
            (item) =>
              item.givenNames.toLowerCase().includes(searchLower) ||
              item.lastName.toLowerCase().includes(searchLower) ||
              item.applicationNumber.toLowerCase().includes(searchLower),
          );
        }

        // Apply intensity filter
        if (!intensityFilter.value.includes(IntensityFilter.All)) {
          filteredResults = filteredResults.filter((item) =>
            intensityFilter.value.includes(item.studyIntensity),
          );
        }

        // Sort the filtered results
        const sortedResults = filteredResults.sort((a, b) => {
          // First sort by status (Pending first)
          if (a.pirStatus === "Required" && b.pirStatus !== "Required")
            return -1;
          if (a.pirStatus !== "Required" && b.pirStatus === "Required")
            return 1;

          // Then sort by submitted date
          return (
            new Date(b.submittedDate).getTime() -
            new Date(a.submittedDate).getTime()
          );
        });

        paginatedApplications.value = {
          results: sortedResults,
          count: sortedResults.length,
        };
      } catch (error: unknown) {
        console.error("Error filtering PIR applications:", error);
      } finally {
        applicationsLoading.value = false;
      }
    };

    const filterByIntensity = () => {
      handleSearch();
    };

    const pageSortEvent = async (options: DataTableOptions) => {
      try {
        applicationsLoading.value = true;
        const response = await ProgramInfoRequestService.shared.getPIRSummary(
          props.locationId,
        );

        // Filter results based on search query and intensity filter
        let filteredResults = response;

        if (searchQuery.value) {
          const searchLower = searchQuery.value.toLowerCase();
          filteredResults = filteredResults.filter(
            (item) =>
              item.givenNames.toLowerCase().includes(searchLower) ||
              item.lastName.toLowerCase().includes(searchLower) ||
              item.applicationNumber.toLowerCase().includes(searchLower),
          );
        }

        // Apply intensity filter
        if (!intensityFilter.value.includes(IntensityFilter.All)) {
          filteredResults = filteredResults.filter((item) =>
            intensityFilter.value.includes(item.studyIntensity),
          );
        }

        // Apply sorting based on column
        if (options.sortBy.length > 0) {
          const sortKey = options.sortBy[0].key;
          const sortOrder = options.sortBy[0].order;

          filteredResults.sort((a: any, b: any) => {
            if (
              sortKey === "submittedDate" ||
              sortKey === "studyStartPeriod" ||
              sortKey === "studyEndPeriod"
            ) {
              const dateA = new Date(a[sortKey]).getTime();
              const dateB = new Date(b[sortKey]).getTime();
              return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
            } else if (sortKey === "pirStatus") {
              // Custom sort for status to always show Pending first
              if (sortOrder === "asc") {
                if (a.pirStatus === "Required" && b.pirStatus !== "Required")
                  return -1;
                if (a.pirStatus !== "Required" && b.pirStatus === "Required")
                  return 1;
              } else {
                if (a.pirStatus === "Required" && b.pirStatus !== "Required")
                  return 1;
                if (a.pirStatus !== "Required" && b.pirStatus === "Required")
                  return -1;
              }
              return a[sortKey].localeCompare(b[sortKey]);
            }
            return 0;
          });
        } else {
          // Default sort: Pending first, then by submitted date desc
          filteredResults.sort((a, b) => {
            if (a.pirStatus === "Required" && b.pirStatus !== "Required")
              return -1;
            if (a.pirStatus !== "Required" && b.pirStatus === "Required")
              return 1;
            return (
              new Date(b.submittedDate).getTime() -
              new Date(a.submittedDate).getTime()
            );
          });
        }

        paginatedApplications.value = {
          results: filteredResults,
          count: filteredResults.length,
        };
      } catch (error: unknown) {
        console.error("Error sorting PIR applications:", error);
      } finally {
        applicationsLoading.value = false;
      }
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
