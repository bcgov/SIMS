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
    <body-header
      title="Active applications"
      data-cy="activeApplicationsTab"
      :recordsCount="paginatedApplications?.count || 0"
    >
      <template #actions>
        <v-row class="m-0 p-0">
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
              placeholder="Search by name"
              variant="outlined"
              density="compact"
              class="search-field"
              hide-details
              clearable
              @update:model-value="handleSearch"
              @click:clear="handleSearch"
              data-cy="searchBox"
            ></v-text-field>
          </v-col>
        </v-row>
      </template>
    </body-header>
    <content-group>
      <toggle-content
        :toggled="!paginatedApplications?.count && !applicationsLoading"
        message="No program information requests found"
      >
        <v-data-table-server
          v-if="paginatedApplications?.count"
          :headers="pirTableHeaders"
          :items="paginatedApplications?.results || []"
          :items-length="paginatedApplications?.count || 0"
          :loading="applicationsLoading"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          :sort-by="[{ key: DEFAULT_SORT_FIELD, order: DEFAULT_SORT_ORDER }]"
          must-sort
          @update:options="paginationAndSortEvent"
        >
          <template #[`item.submittedDate`]="{ item }">
            {{
              item.submittedDate ? dateOnlyLongString(item.submittedDate) : "-"
            }}
          </template>
          <template #[`item.program`]="{ item }">
            {{ getProgramName(item) }}
          </template>
          <template #[`item.studyStartPeriod`]="{ item }">
            {{ getStartDate(item) }}
          </template>
          <template #[`item.studyEndPeriod`]="{ item }">
            {{ getEndDate(item) }}
          </template>
          <template #[`item.studentNumber`]="{ item }">
            {{ item.studentNumber || "-" }}
          </template>
          <template #[`item.studyIntensity`]="{ item }">
            {{ item.studyIntensity || "-" }}
          </template>
          <template #[`item.pirStatus`]="{ item }">
            <status-chip-program-info-request :status="item.pirStatus" />
          </template>
          <template #[`item.actions`]="{ item }">
            <v-btn
              color="primary"
              @click="goToViewApplication(item.applicationId)"
              data-cy="viewPIR"
              >View</v-btn
            >
          </template>
        </v-data-table-server>
      </toggle-content>
    </content-group>
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
  PIRSearchCriteria,
} from "@/services/http/dto";
import {
  DataTableOptions,
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  LayoutTemplates,
} from "@/types";
import type { DataTableSortOrder } from "vuetify/lib/composables/index.mjs";

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

export default defineComponent({
  name: "LocationProgramInfoRequestSummary",
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
    const currentPage = ref(1);
    const currentPageLimit = ref(DEFAULT_PAGE_LIMIT);
    // Initial sort by Status (Pending first) then by Submitted date
    const DEFAULT_SORT_FIELD = "pirStatus";
    const DEFAULT_SORT_ORDER: DataTableSortOrder = "asc";

    const locationName = computed(() => {
      return getLocationName(props.locationId);
    });

    const goToViewApplication = (applicationId: number) => {
      router.push({
        name: InstitutionRoutesConst.PROGRAM_INFO_REQUEST_EDIT,
        params: { locationId: props.locationId, applicationId },
      });
    };

    // Helper functions for displaying correct data based on PIR status
    const getProgramName = (item: PIRSummaryAPIOutDTO): string => {
      if (item.pirStatus === "Required" || item.pirStatus === "Declined") {
        // For Pending or Declined, use student selected program or manual entry
        return item.applicationData?.programName || item.program || "-";
      }
      // For Completed, use the program from assigned offering
      return item.program || "-";
    };

    const getStartDate = (item: PIRSummaryAPIOutDTO): string => {
      const date =
        item.pirStatus === "Required" || item.pirStatus === "Declined"
          ? item.applicationData?.startDate
          : item.studyStartPeriod;
      return date ? dateOnlyLongString(date) : "-";
    };

    const getEndDate = (item: PIRSummaryAPIOutDTO): string => {
      const date =
        item.pirStatus === "Required" || item.pirStatus === "Declined"
          ? item.applicationData?.endDate
          : item.studyEndPeriod;
      return date ? dateOnlyLongString(date) : "-";
    };

    const loadApplications = async (
      page = 1,
      pageLimit = DEFAULT_PAGE_LIMIT,
      sortField = DEFAULT_SORT_FIELD,
      sortOrder: DataTableSortOrder = DEFAULT_SORT_ORDER,
    ) => {
      try {
        applicationsLoading.value = true;
        const searchCriteria: PIRSearchCriteria = {
          page,
          pageLimit,
          sortField,
          sortOrder: sortOrder === "desc" ? "DESC" : "ASC",
          search: searchQuery.value || undefined,
          intensityFilter: !intensityFilter.value.includes(IntensityFilter.All)
            ? intensityFilter.value
            : undefined,
        };

        paginatedApplications.value =
          await ProgramInfoRequestService.shared.getPIRSummary(
            props.locationId,
            searchCriteria,
          );
      } catch (error: unknown) {
        console.error("Error loading PIR applications:", error);
        paginatedApplications.value = {
          results: [],
          count: 0,
        };
      } finally {
        applicationsLoading.value = false;
      }
    };

    // Handle search
    const handleSearch = () => {
      currentPage.value = 1;
      loadApplications(currentPage.value, currentPageLimit.value);
    };

    // Handle intensity filter
    const filterByIntensity = () => {
      currentPage.value = 1;
      loadApplications(currentPage.value, currentPageLimit.value);
    };

    // Handle pagination and sorting
    const paginationAndSortEvent = async (event: DataTableOptions) => {
      currentPage.value = event.page;
      currentPageLimit.value = event.itemsPerPage;

      const [sortByOptions] = event.sortBy;
      await loadApplications(
        event.page,
        event.itemsPerPage,
        sortByOptions?.key || DEFAULT_SORT_FIELD,
        sortByOptions?.order || DEFAULT_SORT_ORDER,
      );
    };

    // Initialize with default sorting
    onMounted(async () => {
      await loadApplications();
    });

    // Watch for location changes
    watch(
      () => props.locationId,
      async () => {
        currentPage.value = 1;
        await loadApplications();
      },
    );

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
      paginationAndSortEvent,
      LayoutTemplates,
      DEFAULT_SORT_FIELD,
      DEFAULT_SORT_ORDER,
      getProgramName,
      getStartDate,
      getEndDate,
    };
  },
});
</script>
