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
        <v-row class="justify-end">
          <v-col cols="auto">
            <v-btn-toggle
              v-model="intensityFilter"
              class="btn-toggle"
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
              label="Search by name or application"
              variant="outlined"
              v-model="searchQuery"
              @keyup.enter="searchProgramTable"
              prepend-inner-icon="mdi-magnify"
              hide-details="auto"
              placeholder="Enter name or application"
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
          :items="applications.results"
          :items-length="applications.count"
          :loading="applicationsLoading"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
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
            >
              View
            </v-btn>
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
  PIRSummaryHeaders,
} from "@/types";

enum StudyIntensity {
  FullTime = "Full Time",
  PartTime = "Part Time",
}

const IntensityFilter = {
  All: "All",
  ...StudyIntensity,
};

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
    const intensityFilter = ref(IntensityFilter.All);
    const applications = ref(
      {} as PaginatedResultsAPIOutDTO<PIRSummaryAPIOutDTO>,
    );
    const currentPage = ref(DEFAULT_DATATABLE_PAGE_NUMBER);
    const currentPageLimit = ref(DEFAULT_PAGE_LIMIT);
    const pirTableHeaders = PIRSummaryHeaders;

    const locationName = computed(() => getLocationName(props.locationId));

    const goToViewApplication = (applicationId: number) => {
      router.push({
        name: InstitutionRoutesConst.PROGRAM_INFO_REQUEST_EDIT,
        params: { locationId: props.locationId, applicationId },
      });
    };

    const getProgramName = (item: PIRSummaryAPIOutDTO): string => {
      if (item.pirStatus === "Required" || item.pirStatus === "Declined") {
        return item.applicationData?.programName || item.program || "-";
      }
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

    const getApiSortOrder = (
      sortOrder?: string,
    ): "ASC" | "DESC" | undefined => {
      if (!sortOrder) return undefined;
      return sortOrder === "asc" ? "ASC" : "DESC";
    };

    const loadApplications = async (
      page = currentPage.value,
      pageLimit = currentPageLimit.value,
      sortField?: string,
      sortOrder?: string,
    ) => {
      try {
        applicationsLoading.value = true;
        const searchCriteria: PIRSearchCriteria = {
          page,
          pageLimit,
          sortField,
          sortOrder: getApiSortOrder(sortOrder),
          search: searchQuery.value || undefined,
          intensityFilter:
            intensityFilter.value !== IntensityFilter.All
              ? [intensityFilter.value]
              : undefined,
        };

        applications.value =
          await ProgramInfoRequestService.shared.getPIRSummary(
            props.locationId,
            searchCriteria,
          );
      } catch (error: unknown) {
        console.error("Error loading PIR applications:", error);
        applications.value = { results: [], count: 0 };
      } finally {
        applicationsLoading.value = false;
      }
    };

    const searchProgramTable = async () => {
      currentPage.value = DEFAULT_DATATABLE_PAGE_NUMBER;
      await loadApplications();
    };

    const filterByIntensity = () => {
      currentPage.value = DEFAULT_DATATABLE_PAGE_NUMBER;
      loadApplications();
    };

    const paginationAndSortEvent = async (event: DataTableOptions) => {
      currentPage.value = event.page;
      currentPageLimit.value = event.itemsPerPage;
      const [sortByOptions] = event.sortBy;

      await loadApplications(
        event.page,
        event.itemsPerPage,
        sortByOptions?.key,
        sortByOptions?.order,
      );
    };

    // When component is mounted, load data
    onMounted(async () => {
      await loadApplications();
    });

    watch(
      () => props.locationId,
      async () => {
        currentPage.value = DEFAULT_DATATABLE_PAGE_NUMBER;
        searchQuery.value = "";
        intensityFilter.value = IntensityFilter.All;
        applications.value = { results: [], count: 0 };
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
      getProgramName,
      getStartDate,
      getEndDate,
    };
  },
});
</script>
