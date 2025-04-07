<template>
  <full-page-container :full-width="true">
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
      :recordsCount="applications?.count || 0"
    >
      <template #actions>
        <v-row class="m-0 p-0">
          <v-col cols="auto" class="mr-4">
            <v-btn-toggle
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
              density="compact"
              label="Search by name or application #"
              variant="outlined"
              v-model="searchQuery"
              data-cy="searchBox"
              @keyup.enter="searchProgramTable"
              prepend-inner-icon="mdi-magnify"
              hide-details="auto"
              placeholder="Enter name or application #"
            ></v-text-field>
          </v-col>
        </v-row>
      </template>
    </body-header>
    <content-group>
      <toggle-content
        :toggled="!applications?.count && !applicationsLoading"
        message="No program information requests found"
      >
        <v-data-table-server
          v-if="applications?.count"
          :headers="pirTableHeaders"
          :items="applications?.results || []"
          :items-length="applications?.count || 0"
          :loading="applicationsLoading"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          @update:options="paginationAndSortEvent"
          class="elevation-1"
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
  DEFAULT_DATATABLE_PAGE_NUMBER,
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  LayoutTemplates,
} from "@/types";

enum StudyIntensity {
  FullTime = "Full Time",
  PartTime = "Part Time",
}

const pirTableHeaders = [
  {
    title: "Submitted Date",
    key: "submittedDate",
    sortable: true,
    align: "start" as const,
  },
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
    const intensityFilter = ref(IntensityFilter.All);
    const applications = ref<
      PaginatedResultsAPIOutDTO<PIRSummaryAPIOutDTO> | undefined
    >(undefined);
    const currentPage = ref(1);
    const currentPageLimit = ref(DEFAULT_PAGE_LIMIT);
    const currentSortField = ref<string | undefined>("submittedDate");
    const currentSortOrder = ref<"ASC" | "DESC" | undefined>("DESC");

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

    // Map UI field names to API field names for sorting
    const getApiSortField = (uiField?: string): string | undefined => {
      if (!uiField) return undefined;

      // Define mappings if API field names differ from UI
      const fieldMapping: Record<string, string> = {
        // Check if any of these fields need to be mapped differently for the API
        submittedDate: "submittedDate",
        studyStartPeriod: "studyStartPeriod",
        studyEndPeriod: "studyEndPeriod",
        pirStatus: "pirStatus",
      };

      return fieldMapping[uiField] || uiField;
    };

    const loadApplications = async (
      page = currentPage.value,
      pageLimit = currentPageLimit.value,
      sortField = currentSortField.value,
      sortOrder = currentSortOrder.value,
    ) => {
      try {
        applicationsLoading.value = true;
        const searchCriteria: PIRSearchCriteria = {
          page,
          pageLimit,
          sortField,
          sortOrder,
          search: searchQuery.value || undefined,
          intensityFilter:
            intensityFilter.value !== IntensityFilter.All
              ? [intensityFilter.value]
              : undefined,
        };

        console.log("Loading PIR applications with criteria:", searchCriteria);

        applications.value =
          await ProgramInfoRequestService.shared.getPIRSummary(
            props.locationId,
            searchCriteria,
          );

        console.log("PIR applications loaded:", applications.value);
      } catch (error: unknown) {
        console.error("Error loading PIR applications:", error);
        applications.value = {
          results: [],
          count: 0,
        };
      } finally {
        applicationsLoading.value = false;
      }
    };

    // Search program table - simplified to match LocationPrograms pattern
    const searchProgramTable = async () => {
      // Reset to first page when searching
      currentPage.value = DEFAULT_DATATABLE_PAGE_NUMBER;
      // Reset applications (helps with UI feedback)
      applications.value = undefined;
      // Load applications with search criteria
      await loadApplications();
    };

    // Handle intensity filter
    const filterByIntensity = () => {
      currentPage.value = DEFAULT_DATATABLE_PAGE_NUMBER;
      applications.value = undefined;
      loadApplications();
    };

    // Handle pagination and sorting
    const paginationAndSortEvent = async (event: DataTableOptions) => {
      console.log("Pagination/Sort Event", JSON.stringify(event, null, 2));

      currentPage.value = event.page;
      currentPageLimit.value = event.itemsPerPage;
      const [sortByOptions] = event.sortBy;

      console.log("Sort options:", sortByOptions);

      // Map the Vuetify sort order to the API expected format ("ASC" or "DESC")
      // Vuetify uses "asc" and "desc" but API expects uppercase
      let apiSortOrder: "ASC" | "DESC" | undefined = undefined;
      if (sortByOptions?.order) {
        apiSortOrder = sortByOptions.order === "asc" ? "ASC" : "DESC";
      }

      // Map UI field name to API field name if needed
      currentSortField.value = getApiSortField(sortByOptions?.key);
      currentSortOrder.value = apiSortOrder;

      console.log(
        `Sorting by: ${currentSortField.value}, Order: ${currentSortOrder.value}`,
      );

      await loadApplications(
        currentPage.value,
        currentPageLimit.value,
        currentSortField.value,
        currentSortOrder.value,
      );
    };

    // Initialize
    onMounted(async () => {
      // Simplified initialization - don't set sort field/order in frontend
      currentPage.value = DEFAULT_DATATABLE_PAGE_NUMBER;
      currentPageLimit.value = DEFAULT_PAGE_LIMIT;
      await loadApplications();
    });

    // Watch for location changes
    watch(
      () => props.locationId,
      async () => {
        // Reset all filters and search when location changes
        currentPage.value = DEFAULT_DATATABLE_PAGE_NUMBER;
        searchQuery.value = "";
        intensityFilter.value = IntensityFilter.All;
        applications.value = undefined; // Clear results first
        await loadApplications();
      },
    );

    return {
      applications,
      dateOnlyLongString,
      goToViewApplication,
      locationName,
      pirTableHeaders,
      applicationsLoading,
      searchQuery,
      searchProgramTable,
      intensityFilter,
      filterByIntensity,
      IntensityFilter,
      StudyIntensity,
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      paginationAndSortEvent,
      LayoutTemplates,
      getProgramName,
      getStartDate,
      getEndDate,
    };
  },
});
</script>
