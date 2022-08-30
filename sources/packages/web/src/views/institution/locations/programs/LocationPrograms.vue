<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator :title="locationName" subTitle="Programs" />
    </template>
    <body-header title="All programs" :recordsCount="programAndCount.count">
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
            hide-details
          />
          <v-btn
            class="ml-2"
            color="primary"
            @click="goToAddNewProgram()"
            prepend-icon="fa:fa fa-plus-circle"
          >
            Create program
          </v-btn>
        </v-row>
      </template>
    </body-header>
    <content-group>
      <toggle-content
        :toggled="!programAndCount.count"
        message="You don't have programs yet"
      >
        <DataTable
          :value="programAndCount.results"
          :lazy="true"
          :paginator="true"
          :rows="DEFAULT_PAGE_LIMIT"
          :rowsPerPageOptions="PAGINATION_LIST"
          :totalRecords="programAndCount.count"
          @page="paginationAndSortEvent($event)"
          @sort="paginationAndSortEvent($event)"
          :loading="loading"
        >
          <Column :field="ProgramSummaryFields.CipCode" header="CIP"></Column>
          <Column
            :field="ProgramSummaryFields.ProgramName"
            header="Program Name"
            :sortable="true"
          ></Column>
          <Column
            :field="ProgramSummaryFields.CredentialType"
            header="Credential"
            :sortable="true"
          >
            <template #body="slotProps">
              <div>
                {{ slotProps.data.credentialTypeToDisplay }}
              </div>
            </template></Column
          >
          <Column
            :field="ProgramSummaryFields.TotalOfferings"
            header="Study periods"
          ></Column>
          <Column
            :field="ProgramSummaryFields.ProgramStatus"
            header="Status"
            :sortable="true"
            ><template #body="slotProps">
              <status-chip-program
                :status="slotProps.data.programStatus"
              ></status-chip-program></template
          ></Column>
          <Column header="Action">
            <template #body="slotProps">
              <v-btn
                color="primary"
                @click="goToViewProgram(slotProps.data.programId)"
                >View</v-btn
              >
            </template>
          </Column>
        </DataTable>
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
  DEFAULT_PAGE_NUMBER,
  PAGINATION_LIST,
  ProgramSummaryFields,
  DataTableSortOrder,
  EducationProgramsSummary,
  PaginatedResults,
} from "@/types";
import { ref, watch, computed } from "vue";
import StatusChipProgram from "@/components/generic/StatusChipProgram.vue";
import { useInstitutionState } from "@/composables";

export default {
  components: { StatusChipProgram },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const { getLocationName } = useInstitutionState();
    const router = useRouter();
    const programAndCount = ref(
      {} as PaginatedResults<EducationProgramsSummary>,
    );
    const locationDetails = ref();
    const loading = ref(false);
    const searchBox = ref("");
    const currentPage = ref();
    const currentPageLimit = ref();

    const locationName = computed(() => {
      return getLocationName(parseInt(props.locationId));
    });

    /**
     * function to load program list and count for institution
     * @param page page number, if nothing passed then DEFAULT_PAGE_NUMBER
     * @param pageCount page limit, if nothing passed then DEFAULT_PAGE_LIMIT
     * @param sortField sort field, if nothing passed then InstitutionProgramSummaryFields.ApprovalStatus
     * @param sortOrder sort oder, if nothing passed then DataTableSortOrder.ASC
     */
    const loadSummary = async (
      page = DEFAULT_PAGE_NUMBER,
      pageCount = DEFAULT_PAGE_LIMIT,
      sortField?: ProgramSummaryFields,
      sortOrder?: DataTableSortOrder,
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
    const paginationAndSortEvent = async (event: any) => {
      currentPage.value = event?.page;
      currentPageLimit.value = event?.rows;
      await loadSummary(
        event.page,
        event.rows,
        event.sortField,
        event.sortOrder,
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
      await loadSummary(
        currentPage.value ?? DEFAULT_PAGE_NUMBER,
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
      DEFAULT_PAGE_NUMBER,
      PAGINATION_LIST,
      paginationAndSortEvent,
      searchProgramTable,
      loading,
      searchBox,
      ProgramSummaryFields,
      locationName,
    };
  },
};
</script>
