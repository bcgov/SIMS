<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator
        :title="locationName"
        data-cy="programsHeader"
        sub-title="Programs"
      />
    </template>
    <body-header title="All programs" :records-count="programAndCount?.count">
      <template #actions>
        <div class="d-flex justify-end">
          <v-btn
            v-if="!isReadOnlyUser(locationId)"
            color="primary"
            @click="goToAddNewProgram()"
            data-cy="createProgram"
            prepend-icon="fa:fa fa-plus-circle"
          >
            Create program
          </v-btn>
        </div>
      </template>
    </body-header>
    <content-group>
      <v-row class="m-0 p-0 mb-2" align="center">
        <v-col md="auto" class="flex-grow-1 pa-0 pr-2 mb-1">
          <v-text-field
            density="compact"
            label="Search Program name or SABC program code or CIP"
            variant="outlined"
            v-model="searchBox"
            @keyup.enter="searchProgramTable"
            prepend-inner-icon="mdi-magnify"
            hide-details="auto"
          />
        </v-col>
        <v-col cols="auto" class="pa-0">
          <v-btn color="primary" @click="searchProgramTable"> Search </v-btn>
        </v-col>
        <v-col cols="auto" class="pa-0">
          <v-btn-toggle
            :model-value="selectedStatuses"
            @update:model-value="handleStatusChange"
            multiple
            density="compact"
            class="flex-wrap btn-toggle"
            selected-class="selected-btn-toggle"
          >
            <v-btn rounded="xl" :value="ALL_STATUS" color="primary" class="mx-2"
              >All</v-btn
            >
            <v-btn
              rounded="xl"
              :value="ProgramStatus.Approved"
              color="primary"
              class="mr-2"
              >Approved</v-btn
            >
            <v-btn
              rounded="xl"
              :value="ProgramStatus.Pending"
              color="primary"
              class="mr-2"
              >Pending</v-btn
            >
            <v-btn
              rounded="xl"
              :value="ProgramStatus.Declined"
              color="primary"
              class="mr-2"
              >Declined</v-btn
            >
            <v-btn rounded="xl" :value="INACTIVE_PROGRAM" color="primary"
              >Inactive</v-btn
            >
          </v-btn-toggle>
        </v-col>
      </v-row>
      <toggle-content
        :toggled="!programAndCount?.count"
        message="You don't have programs yet"
      >
        <v-data-table-server
          v-if="programAndCount?.count"
          :headers="ProgramSummaryHeaders"
          :items="programAndCount?.results"
          :items-length="programAndCount?.count"
          :loading="loading"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          v-model:sort-by="sortBy"
          @update:options="paginationAndSortEvent"
        >
          <template #item="{ item }">
            <tr>
              <td>{{ item.programName }}</td>
              <td>
                {{ item.credentialTypeToDisplay }}
              </td>
              <td>{{ item.cipCode }}</td>
              <td>{{ emptyStringFiller(item.sabcCode) }}</td>
              <td data-cy="programStudyPeriods">
                {{ item.totalOfferings }}
              </td>
              <td data-cy="programStatus">
                <status-chip-program
                  :status="item.programStatus"
                  :is-active="item.isActive && !item.isExpired"
                ></status-chip-program>
              </td>
              <td>
                <v-btn
                  color="primary"
                  @click="goToViewProgram(item.programId)"
                  data-cy="viewProgram"
                  >View</v-btn
                >
              </td>
            </tr>
          </template>
        </v-data-table-server>
      </toggle-content>
    </content-group>
  </full-page-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { EducationProgramService } from "@/services/EducationProgramService";
import { InstitutionService } from "@/services/InstitutionService";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  DEFAULT_DATATABLE_PAGE_NUMBER,
  ProgramSummaryFields,
  EducationProgramsSummary,
  PaginatedResults,
  ProgramSummaryHeaders,
  DataTableOptions,
  DataTableSortByOrder,
  ProgramStatus,
} from "@/types";
import { INACTIVE_PROGRAM } from "@/constants";
import { ref, watch, computed, defineComponent } from "vue";
import StatusChipProgram from "@/components/generic/StatusChipProgram.vue";
import {
  useInstitutionAuth,
  useInstitutionState,
  useFormatters,
} from "@/composables";

export default defineComponent({
  components: { StatusChipProgram },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const { getLocationName } = useInstitutionState();
    const { isReadOnlyUser } = useInstitutionAuth();
    const { emptyStringFiller } = useFormatters();
    const router = useRouter();
    const programAndCount = ref(
      {} as PaginatedResults<EducationProgramsSummary> | undefined,
    );
    const locationDetails = ref();
    const loading = ref(false);
    const searchBox = ref("");
    const sortBy = ref([
      {
        key: ProgramSummaryFields.ProgramName,
        order: DataTableSortByOrder.ASC,
      },
    ]);
    // Sentinel value used to represent the "All" filter state.
    const ALL_STATUS = "All";
    const selectedStatuses = ref([ALL_STATUS]);
    const currentPage = ref();
    const currentPageLimit = ref();

    const locationName = computed(() => {
      return getLocationName(props.locationId);
    });

    /**
     * Builds the search criteria object from the current search box and status
     * filter values, used consistently across search and pagination/sort events.
     * @returns The search criteria object reflecting the current filter state.
     */
    const getSearchCriteria = () => {
      const statusSearch = selectedStatuses.value.filter(
        (s) => s !== INACTIVE_PROGRAM && s !== ALL_STATUS,
      );
      return {
        searchCriteria: searchBox.value,
        inactiveProgramSearch:
          selectedStatuses.value.includes(INACTIVE_PROGRAM),
        ...(statusSearch.length ? { statusSearch } : {}),
      };
    };

    /**
     * Function to load program list and count for institution.
     * @param page page number, if nothing passed then DEFAULT_DATATABLE_PAGE_NUMBER.
     * @param pageCount page limit, if nothing passed then DEFAULT_PAGE_LIMIT.
     * @param sortField sort field, if nothing passed then api sorts with programStatus.
     * @param sortOrder sort order, if nothing passed then DataTableSortByOrder.ASC.
     */
    const loadSummary = async (
      page = DEFAULT_DATATABLE_PAGE_NUMBER,
      pageCount = DEFAULT_PAGE_LIMIT,
      sortField?: string,
      sortOrder?: DataTableSortByOrder,
    ) => {
      loading.value = true;
      programAndCount.value =
        await EducationProgramService.shared.getProgramsSummaryByLocationId(
          props.locationId,
          {
            searchCriteria: getSearchCriteria(),
            sortField,
            sortOrder,
            page,
            pageLimit: pageCount,
          },
        );
      loading.value = false;
    };

    // Pagination sort event callback.
    const paginationAndSortEvent = async (event: DataTableOptions) => {
      currentPage.value = event.page;
      currentPageLimit.value = event.itemsPerPage;
      const [sortByOptions] = event.sortBy;
      await loadSummary(
        event.page,
        event.itemsPerPage,
        sortByOptions?.key,
        sortByOptions?.order,
      );
    };

    const loadProgramDetails = async () => {
      locationDetails.value =
        await InstitutionService.shared.getInstitutionLocation(
          props.locationId,
        );
    };

    // Search program table.
    const searchProgramTable = async () => {
      // When search is happening in a page other than the first page,
      // There is an unexpected behavior, probably which can be
      // fixed in the stable vuetify version.
      // Below is the fix for the search issue.
      programAndCount.value = undefined;
      await loadSummary(
        currentPage.value ?? DEFAULT_DATATABLE_PAGE_NUMBER,
        currentPageLimit.value ?? DEFAULT_PAGE_LIMIT,
      );
    };

    watch(
      () => props.locationId,
      async () => {
        // Load program summary and institution details.
        await Promise.all([loadSummary(), loadProgramDetails()]);
      },
      { immediate: true },
    );

    /**
     * Handles status filter changes from the toggle group, enforcing mutual
     * exclusivity between "All" and specific statuses, and reloading the table
     * when the effective selection changes.
     * @param newVal The new array of selected status values emitted by the toggle.
     */
    const handleStatusChange = async (newVal: string[]) => {
      const oldVal = selectedStatuses.value;
      if (newVal.includes(ALL_STATUS) && newVal.length > 1) {
        // Clicking "All" while others are active clears them
        // Clicking a status while "All" is active removes "All".
        selectedStatuses.value = oldVal.includes(ALL_STATUS)
          ? newVal.filter((s) => s !== ALL_STATUS)
          : [ALL_STATUS];
      } else if (newVal.length === 0) {
        // Nothing selected – fall back to "All".
        selectedStatuses.value = [ALL_STATUS];
      } else {
        selectedStatuses.value = newVal;
      }
      await searchProgramTable();
    };

    const goToAddNewProgram = () => {
      router.push({
        name: InstitutionRoutesConst.ADD_LOCATION_PROGRAMS,
        params: {
          locationId: props.locationId,
        },
      });
    };

    const goToViewProgram = (programId: number) => {
      router.push({
        name: InstitutionRoutesConst.VIEW_LOCATION_PROGRAMS,
        params: {
          programId,
          locationId: props.locationId,
        },
      });
    };

    return {
      programAndCount,
      goToAddNewProgram,
      goToViewProgram,
      locationDetails,
      DEFAULT_PAGE_LIMIT,
      DEFAULT_DATATABLE_PAGE_NUMBER,
      ITEMS_PER_PAGE,
      paginationAndSortEvent,
      searchProgramTable,
      loading,
      searchBox,
      ProgramSummaryFields,
      locationName,
      ProgramSummaryHeaders,
      isReadOnlyUser,
      selectedStatuses,
      handleStatusChange,
      ALL_STATUS,
      ProgramStatus,
      INACTIVE_PROGRAM,
      sortBy,
      emptyStringFiller,
    };
  },
});
</script>
