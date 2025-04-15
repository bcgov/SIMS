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
      :recordsCount="applications.count"
    >
      <template #actions>
        <v-row class="justify-end">
          <v-col cols="auto">
            <v-btn-toggle
              v-model="intensityFilter"
              class="btn-toggle"
              selected-class="selected-btn-toggle"
              @update:model-value="resetPageAndLoadApplications"
            >
              <v-btn
                rounded="xl"
                color="primary"
                :value="IntensityFilter.All"
                class="mr-2"
                >All</v-btn
              >
              <v-btn
                v-for="intensity in Object.values(OfferingIntensity)"
                :key="intensity"
                rounded="xl"
                color="primary"
                :value="intensity"
                class="mr-2"
                >{{ mapOfferingIntensity(intensity) }}</v-btn
              >
            </v-btn-toggle>
          </v-col>
          <v-col cols="3">
            <v-text-field
              density="compact"
              label="Search by name or application"
              variant="outlined"
              v-model="searchQuery"
              @keyup.enter="resetPageAndLoadApplications"
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
        :toggled="!applications.count"
        message="No program information requests found"
      >
        <v-data-table-server
          v-if="applications?.count"
          :headers="PIRSummaryHeaders"
          :items="applications.results"
          :items-length="applications.count"
          :loading="applicationsLoading"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          @update:options="paginationAndSortEvent"
        >
          <template #[`item.submittedDate`]="{ item }">
            {{ dateOnlyLongString(item.submittedDate) }}
          </template>
          <template #[`item.program`]="{ item }">
            {{ item.program }}
          </template>
          <template #[`item.studyStartPeriod`]="{ item }">
            {{ dateOnlyLongString(item.studyStartPeriod) }}
          </template>
          <template #[`item.studyEndPeriod`]="{ item }">
            {{ dateOnlyLongString(item.studyEndPeriod) }}
          </template>
          <template #[`item.studentNumber`]="{ item }">
            {{ emptyStringFiller(item.studentNumber) }}
          </template>
          <template #[`item.studyIntensity`]="{ item }">
            {{ mapOfferingIntensity(item.studyIntensity) }}
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
import { useFormatters, useInstitutionState, useOffering } from "@/composables";
import StatusChipProgramInfoRequest from "@/components/generic/StatusChipProgramInfoRequest.vue";
import {
  PIRSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import {
  DataTableOptions,
  DEFAULT_DATATABLE_PAGE_NUMBER,
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  PIRSummaryHeaders,
  PaginationOptions,
  DataTableSortByOrder,
  OfferingIntensity,
} from "@/types";

const IntensityFilter = {
  All: "All",
  ...OfferingIntensity,
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
    const { dateOnlyLongString, emptyStringFiller } = useFormatters();
    const { mapOfferingIntensity } = useOffering();
    const applicationsLoading = ref(false);
    const searchQuery = ref("");
    const intensityFilter = ref(IntensityFilter.All);
    const applications = ref(
      {} as PaginatedResultsAPIOutDTO<PIRSummaryAPIOutDTO>,
    );

    const locationName = computed(() => getLocationName(props.locationId));

    const goToViewApplication = (applicationId: number) => {
      router.push({
        name: InstitutionRoutesConst.PROGRAM_INFO_REQUEST_EDIT,
        params: { locationId: props.locationId, applicationId },
      });
    };

    const loadApplications = async (
      page = DEFAULT_DATATABLE_PAGE_NUMBER,
      pageLimit = DEFAULT_PAGE_LIMIT,
      inputSortField?: string,
      inputSortOrder?: DataTableSortByOrder,
    ) => {
      try {
        applicationsLoading.value = true;

        const searchCriteria: PaginationOptions = {
          page,
          pageLimit,
          sortField: inputSortField,
          sortOrder: inputSortOrder,
        };
        if (
          intensityFilter.value &&
          intensityFilter.value !== IntensityFilter.All
        ) {
          searchCriteria.searchCriteria = {
            search: searchQuery.value,
            intensityFilter: intensityFilter.value as OfferingIntensity,
          };
        } else {
          searchCriteria.searchCriteria = {
            search: searchQuery.value,
          };
        }
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

    const resetPageAndLoadApplications = async () => {
      await loadApplications();
    };

    const paginationAndSortEvent = async (event: DataTableOptions) => {
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
      PIRSummaryHeaders,
      applicationsLoading,
      searchQuery,
      intensityFilter,
      IntensityFilter,
      OfferingIntensity,
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      paginationAndSortEvent,
      resetPageAndLoadApplications,
      emptyStringFiller,
      mapOfferingIntensity,
    };
  },
});
</script>
