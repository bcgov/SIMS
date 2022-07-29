<template>
  <full-page-container>
    <template #header>
      <header-navigator
        :title="locationDetails?.locationName"
        subTitle="Programs"
      />
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
          <v-btn class="ml-2" color="primary" @click="goToAddNewProgram()">
            <v-icon size="25" left> mdi-open-in-new </v-icon>
            Create New Program
          </v-btn>
        </v-row>
      </template>
    </body-header>
    <content-group>
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
          header="Offerings"
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
        <Column>
          <template #body="slotProps">
            <v-btn
              variant="outlined"
              @click="goToViewProgram(slotProps.data.id)"
              >View</v-btn
            >
          </template>
        </Column>
      </DataTable>
    </content-group>
  </full-page-container>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { EducationProgramService } from "@/services/EducationProgramService";
import { InstitutionService } from "@/services/InstitutionService";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import {
  PaginatedResults,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  PAGINATION_LIST,
  ProgramSummaryFields,
  DataTableSortOrder,
  SummaryEducationProgramDto,
} from "@/types";
import { ref, watch, onMounted } from "vue";
import StatusChipProgram from "@/components/generic/StatusChipProgram.vue";

export default {
  components: { StatusChipProgram },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const programAndCount = ref(
      {} as PaginatedResults<SummaryEducationProgramDto>,
    );
    const locationDetails = ref();
    const loading = ref(false);
    const searchBox = ref("");
    const currentPage = ref();
    const currentPageLimit = ref();

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
        await EducationProgramService.shared.getLocationProgramsSummary(
          props.locationId,
          page,
          pageCount,
          searchBox.value,
          sortField,
          sortOrder,
        );
      loading.value = false;
    };

    // pagination sort event callback
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
    // search program table
    const searchProgramTable = async () => {
      await loadSummary(
        currentPage.value ?? DEFAULT_PAGE_NUMBER,
        currentPageLimit.value ?? DEFAULT_PAGE_LIMIT,
      );
    };
    onMounted(async () => {
      await Promise.all([loadSummary(), loadProgramDetails()]);
    });

    watch(
      () => props.locationId,
      async () => {
        // load program summary and institution details
        await Promise.all([loadSummary(), loadProgramDetails()]);
      },
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
    };
  },
};
</script>
