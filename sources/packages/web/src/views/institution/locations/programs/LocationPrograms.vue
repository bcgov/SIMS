<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator
        :title="locationName"
        data-cy="programsHeader"
        subTitle="Programs"
      />
    </template>
    <body-header title="All programs" :recordsCount="programAndCount?.count">
      <template #actions>
        <v-row class="m-0 p-0">
          <v-text-field
            density="compact"
            label="Search Program"
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
            @click="goToAddNewProgram()"
            data-cy="createProgram"
            prepend-icon="fa:fa fa-plus-circle"
          >
            Create program
          </v-btn>
        </v-row>
      </template>
    </body-header>
    <content-group>
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
          @update:options="paginationAndSortEvent"
        >
          <template #item="{ item }">
            <tr>
              <td data-cy="programCIP">{{ item.cipCode }}</td>
              <td data-cy="programName">{{ item.programName }}</td>
              <td data-cy="programCredential">
                {{ item.credentialType }}
              </td>
              <td data-cy="programStudyPeriods">
                {{ item.totalOfferings }}
              </td>
              <td data-cy="programStatus">
                <status-chip-program
                  :status="item.programStatus"
                  :is-active="item.isActive"
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
  DEFAULT_DATATABLE_PAGE_NUMBER,
  PAGINATION_LIST,
  ProgramSummaryFields,
  EducationProgramsSummary,
  PaginatedResults,
  ProgramSummaryHeaders,
  DataTableOptions,
  DataTableSortByOrder,
} from "@/types";
import { ref, watch, computed, defineComponent } from "vue";
import StatusChipProgram from "@/components/generic/StatusChipProgram.vue";
import { useInstitutionState } from "@/composables";

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
    const router = useRouter();
    const programAndCount = ref(
      {} as PaginatedResults<EducationProgramsSummary> | undefined,
    );
    const locationDetails = ref();
    const loading = ref(false);
    const searchBox = ref("");
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
      programAndCount.value =
        await EducationProgramService.shared.getProgramsSummaryByLocationId(
          props.locationId,
          {
            searchCriteria: searchBox.value,
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
      PAGINATION_LIST,
      paginationAndSortEvent,
      searchProgramTable,
      loading,
      searchBox,
      ProgramSummaryFields,
      locationName,
      ProgramSummaryHeaders,
    };
  },
});
</script>
