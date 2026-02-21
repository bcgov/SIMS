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
      <v-row class="m-0 p-0 mb-4" align="center">
        <v-text-field
          density="compact"
          label="Search program name, SABC program code or CIP"
          variant="outlined"
          v-model="searchBox"
          data-cy="searchBox"
          @keyup.enter="searchProgramTable"
          prepend-inner-icon="mdi-magnify"
          hide-details="auto"
        />
        <v-btn
          class="ml-2"
          color="primary"
          @click="searchProgramTable"
          data-cy="searchProgramBtn"
        >
          Search
        </v-btn>
        <v-btn-toggle
          v-model="selectedStatuses"
          multiple
          density="compact"
          class="ml-2 btn-toggle"
          selected-class="selected-btn-toggle"
        >
          <v-btn
            rounded="xl"
            :value="ALL_STATUS"
            color="primary"
            class="ml-2"
            data-cy="filterStatusAll"
            >All</v-btn
          >
          <v-btn
            rounded="xl"
            :value="ProgramStatus.Approved"
            color="primary"
            class="ml-2"
            data-cy="filterStatusApproved"
            >Approved</v-btn
          >
          <v-btn
            rounded="xl"
            :value="ProgramStatus.Pending"
            color="primary"
            class="ml-2"
            data-cy="filterStatusPending"
            >Pending</v-btn
          >
          <v-btn
            rounded="xl"
            :value="ProgramStatus.Declined"
            color="primary"
            class="ml-2"
            data-cy="filterStatusDeclined"
            >Declined</v-btn
          >
          <v-btn
            rounded="xl"
            :value="INACTIVE_PROGRAM"
            color="primary"
            class="ml-2"
            data-cy="filterStatusInactive"
            >Inactive</v-btn
          >
        </v-btn-toggle>
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
          :sort-by="[
            {
              key: ProgramSummaryFields.ProgramName,
              order: DataTableSortByOrder.ASC,
            },
          ]"
          @update:options="paginationAndSortEvent"
        >
          <template #item="{ item }">
            <tr>
              <td data-cy="programName">{{ item.programName }}</td>
              <td data-cy="programCredential">
                {{ item.credentialTypeToDisplay }}
              </td>
              <td data-cy="programCIP">{{ item.cipCode }}</td>
              <td data-cy="programSabcCode">{{ item.sabcCode || "-" }}</td>
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
import { useInstitutionAuth, useInstitutionState } from "@/composables";

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
    const router = useRouter();
    const programAndCount = ref(
      {} as PaginatedResults<EducationProgramsSummary> | undefined,
    );
    const locationDetails = ref();
    const loading = ref(false);
    const searchBox = ref("");
    // Sentinel value used to represent the "All" filter state.
    const ALL_STATUS = "all";
    const selectedStatuses = ref<string[]>([ALL_STATUS]);
    const currentPage = ref();
    const currentPageLimit = ref();

    const locationName = computed(() => {
      return getLocationName(props.locationId);
    });

    /**
     * Function to load program list and count for institution.
     * @param page page number, if nothing passed then DEFAULT_DATATABLE_PAGE_NUMBER.
     * @param pageCount page limit, if nothing passed then DEFAULT_PAGE_LIMIT.
     * @param sortField sort field, if nothing passed then api sorts with programStatus.
     * @param sortOrder sort oder, if nothing passed then DataTableSortByOrder.ASC.
     */
    const loadSummary = async (
      page = DEFAULT_DATATABLE_PAGE_NUMBER,
      pageCount = DEFAULT_PAGE_LIMIT,
      sortField?: string,
      sortOrder?: DataTableSortByOrder,
    ) => {
      loading.value = true;
      const inactiveProgramSearch =
        selectedStatuses.value.includes(INACTIVE_PROGRAM);
      const statusSearch = selectedStatuses.value.filter(
        (s) => s !== INACTIVE_PROGRAM && s !== ALL_STATUS,
      );
      programAndCount.value =
        await EducationProgramService.shared.getProgramsSummaryByLocationId(
          props.locationId,
          {
            searchCriteria: {
              searchCriteria: searchBox.value,
              inactiveProgramSearch,
              ...(statusSearch.length ? { statusSearch } : {}),
            },
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

    // Enforce mutual exclusivity between "All" and specific statuses,
    // and reload the table when the effective selection changes.
    watch(selectedStatuses, async (newVal, oldVal) => {
      if (newVal.includes(ALL_STATUS) && newVal.length > 1) {
        // Clicking "All" while others are active clears them; clicking a
        // status while "All" is active removes "All".
        selectedStatuses.value = oldVal.includes(ALL_STATUS)
          ? newVal.filter((s) => s !== ALL_STATUS)
          : [ALL_STATUS];
        return;
      }
      if (newVal.length === 0) {
        // Nothing selected – fall back to "All".
        selectedStatuses.value = [ALL_STATUS];
        return;
      }
      await searchProgramTable();
    });

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
      ALL_STATUS,
      ProgramStatus,
      INACTIVE_PROGRAM,
      DataTableSortByOrder,
    };
  },
});
</script>
