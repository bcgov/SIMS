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
    />
    <content-group>
      <v-row class="px-4 py-2">
        <v-col cols="4">
          <v-text-field
            v-model="searchName"
            label="Search by Name"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="searchApplications"
          />
        </v-col>
        <v-col cols="4">
          <v-select
            v-model="selectedIntensity"
            :items="intensityOptions"
            label="Study Intensity"
            prepend-inner-icon="mdi-school"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="searchApplications"
          />
        </v-col>
      </v-row>
      <toggle-content :toggled="!applications.count">
        <v-data-table-server
          v-if="applications.count"
          :headers="headers"
          :items="applications.results"
          :items-length="applications.count"
          :loading="loading"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          @update:options="paginationAndSortEvent"
        >
          <template #[`item.submittedDate`]="{ item }">
            {{ dateOnlyLongString(item.submittedDate) }}
          </template>
          <template #[`item.program`]="{ item }">
            {{ getDisplayProgram(item) }}
          </template>
          <template #[`item.studyStartPeriod`]="{ item }">
            {{ dateOnlyLongString(getDisplayStudyPeriod(item).start) }} -
            {{ dateOnlyLongString(getDisplayStudyPeriod(item).end) }}
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
  </full-page-container>
</template>

<script lang="ts">
import { onMounted, ref, watch, computed, defineComponent } from "vue";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { ProgramInfoRequestService } from "@/services/ProgramInfoRequestService";
import { useFormatters, useInstitutionState } from "@/composables";
import StatusChipProgramInfoRequest from "@/components/generic/StatusChipProgramInfoRequest.vue";
import { PIRSummaryAPIOutDTO } from "@/services/http/dto";
import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  DataTableOptions,
  PaginatedResults,
  OfferingIntensity,
  DataTableSortByOrder,
  DEFAULT_DATATABLE_PAGE_NUMBER,
  ProgramInfoStatus,
} from "@/types";

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
    const loading = ref(false);
    const searchName = ref("");
    const selectedIntensity = ref<OfferingIntensity | null>(null);
    const applications = ref({} as PaginatedResults<PIRSummaryAPIOutDTO>);
    const currentPage = ref(DEFAULT_DATATABLE_PAGE_NUMBER);
    const currentPageLimit = ref(DEFAULT_PAGE_LIMIT);
    const currentSortField = ref("pirStatus,submittedDate");
    const currentSortOrder = ref(DataTableSortByOrder.DESC);

    const headers = [
      { title: "Submitted Date", key: "submittedDate", sortable: true },
      { title: "Application #", key: "applicationNumber", sortable: true },
      { title: "Given Names", key: "givenNames", sortable: true },
      { title: "Last Name", key: "lastName", sortable: true },
      { title: "Student Number", key: "studentNumber", sortable: true },
      { title: "Intensity", key: "intensity", sortable: true },
      {
        title: "Program",
        key: "program",
        sortable: true,
        align: "start" as const,
      },
      {
        title: "Study Period",
        key: "studyStartPeriod",
        sortable: true,
      },
      {
        title: "Status",
        key: "pirStatus",
        sortable: true,
        align: "start" as const,
      },
      { title: "Actions", key: "actions", sortable: false },
    ];

    const intensityOptions = [
      { title: "All", value: null },
      { title: "Full Time", value: OfferingIntensity.fullTime },
      { title: "Part Time", value: OfferingIntensity.partTime },
    ];

    const locationName = computed(() => {
      return getLocationName(props.locationId);
    });

    const isPendingOrCancelled = (status: ProgramInfoStatus) => {
      return (
        status === ProgramInfoStatus.required ||
        status === ProgramInfoStatus.declined
      );
    };

    const getDisplayProgram = (item: PIRSummaryAPIOutDTO) => {
      if (isPendingOrCancelled(item.pirStatus)) {
        return item.studentSelectedProgram || item.studentCustomProgram;
      }
      return item.program;
    };

    const getDisplayStudyPeriod = (item: PIRSummaryAPIOutDTO) => {
      if (isPendingOrCancelled(item.pirStatus)) {
        return {
          start: item.studentStudyStartDate,
          end: item.studentStudyEndDate,
        };
      }
      return {
        start: item.studyStartPeriod,
        end: item.studyEndPeriod,
      };
    };

    const goToViewApplication = (applicationId: number) => {
      router.push({
        name: InstitutionRoutesConst.PROGRAM_INFO_REQUEST_EDIT,
        params: { locationId: props.locationId, applicationId },
      });
    };

    const updateSummaryList = async () => {
      loading.value = true;
      try {
        applications.value =
          await ProgramInfoRequestService.shared.getPIRSummary(
            props.locationId,
            {
              page: currentPage.value,
              pageLimit: currentPageLimit.value,
              sortField: currentSortField.value,
              sortOrder: currentSortOrder.value,
              searchName: searchName.value,
              intensity: selectedIntensity.value,
            },
          );
      } finally {
        loading.value = false;
      }
    };

    const paginationAndSortEvent = async (event: DataTableOptions) => {
      currentPage.value = event.page;
      currentPageLimit.value = event.itemsPerPage;
      const [sortByOptions] = event.sortBy;
      if (sortByOptions) {
        currentSortField.value = sortByOptions.key;
        currentSortOrder.value = sortByOptions.order;
      }
      await updateSummaryList();
    };

    const searchApplications = async () => {
      currentPage.value = DEFAULT_DATATABLE_PAGE_NUMBER;
      await updateSummaryList();
    };

    watch(
      () => props.locationId,
      async () => {
        await updateSummaryList();
      },
    );

    onMounted(async () => {
      await updateSummaryList();
    });

    return {
      applications,
      dateOnlyLongString,
      goToViewApplication,
      locationName,
      loading,
      headers,
      searchName,
      selectedIntensity,
      intensityOptions,
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      paginationAndSortEvent,
      searchApplications,
      getDisplayProgram,
      getDisplayStudyPeriod,
    };
  },
});
</script>
