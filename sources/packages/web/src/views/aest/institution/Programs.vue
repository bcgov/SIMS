<template>
  <tab-container>
    <body-header-container>
      <template #header>
        <body-header
          title="All Programs"
          :recordsCount="institutionProgramsSummary.count"
        >
          <template #actions>
            <v-text-field
              density="compact"
              v-model="searchProgramName"
              label="Search Program Name"
              data-cy="searchProgramName"
              variant="outlined"
              @keyup.enter="goToSearchProgramName()"
              prepend-inner-icon="mdi-magnify"
              hide-details="auto"
            />
          </template>
        </body-header>
      </template>
      <content-group>
        <DataTable
          :value="institutionProgramsSummary.results"
          :lazy="true"
          :paginator="true"
          :rows="DEFAULT_PAGE_LIMIT"
          :rowsPerPageOptions="PAGINATION_LIST"
          :totalRecords="institutionProgramsSummary.count"
          @page="pageSortEvent($event)"
          @sort="pageSortEvent($event)"
          :loading="loading"
        >
          <template #empty>
            <p class="text-center font-weight-bold">No records found.</p>
          </template>
          <Column
            :field="ProgramSummaryFields.SubmittedDate"
            header="Date Submitted"
            :sortable="true"
          >
            <template #body="slotProps">
              <div class="p-text-capitalize">
                {{ slotProps.data.submittedDateFormatted }}
              </div>
            </template>
          </Column>
          <Column
            :field="ProgramSummaryFields.ProgramName"
            header="Program Name"
          >
            <template #body="slotProps">
              <div class="p-text-capitalize">
                {{ slotProps.data.programName }}
              </div>
            </template>
          </Column>
          <Column :field="ProgramSummaryFields.LocationName" header="Location">
            <template #body="slotProps">
              <div class="p-text-capitalize">
                {{ slotProps.data.locationName }}
              </div>
            </template>
          </Column>
          <Column
            :field="ProgramSummaryFields.TotalOfferings"
            header="Study periods"
          >
          </Column>
          <Column :field="ProgramSummaryFields.ProgramStatus" header="Status"
            ><template #body="slotProps">
              <status-chip-program
                :status="slotProps.data.programStatus"
                :is-active="slotProps.data.isActive"
              ></status-chip-program> </template
          ></Column>
          <Column header="Action">
            <template #body="slotProps">
              <v-btn
                variant="outlined"
                @click="
                  goToViewProgramDetail(
                    slotProps.data.programId,
                    slotProps.data.locationId,
                  )
                "
                >View</v-btn
              >
            </template>
          </Column>
        </DataTable>
      </content-group>
    </body-header-container>
  </tab-container>
</template>

<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import { useRouter } from "vue-router";
import {
  DataTableSortOrder,
  ProgramSummaryFields,
  DEFAULT_PAGE_NUMBER,
  PAGINATION_LIST,
  DEFAULT_PAGE_LIMIT,
  PaginatedResults,
  EducationProgramsSummary,
  LayoutTemplates,
} from "@/types";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import StatusChipProgram from "@/components/generic/StatusChipProgram.vue";
import { EducationProgramService } from "@/services/EducationProgramService";

export default defineComponent({
  components: { StatusChipProgram },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const institutionProgramsSummary = ref(
      {} as PaginatedResults<EducationProgramsSummary>,
    );
    const searchProgramName = ref("");
    const currentPageSize = ref();
    const loading = ref(false);

    const getProgramsSummaryList = async (
      institutionId: number,
      rowsPerPage: number,
      page: number,
      programName: string,
      sortColumn?: ProgramSummaryFields,
      sortOrder?: DataTableSortOrder,
    ) => {
      try {
        loading.value = true;
        searchProgramName.value = programName;
        institutionProgramsSummary.value =
          await EducationProgramService.shared.getProgramsSummaryByInstitutionId(
            institutionId,
            {
              searchCriteria: programName,
              pageLimit: rowsPerPage,
              page,
              sortField: sortColumn,
              sortOrder,
            },
          );
      } finally {
        loading.value = false;
      }
    };
    onMounted(async () => {
      await getProgramsSummaryList(
        props.institutionId,
        DEFAULT_PAGE_LIMIT,
        DEFAULT_PAGE_NUMBER,
        searchProgramName.value,
      );
    });
    const goToViewProgramDetail = (programId: number, locationId: number) => {
      router.push({
        name: AESTRoutesConst.PROGRAM_DETAILS,
        params: {
          programId: programId,
          institutionId: props.institutionId,
          locationId: locationId,
        },
      });
    };
    const pageSortEvent = async (event: any) => {
      currentPageSize.value = event?.rows;
      await getProgramsSummaryList(
        props.institutionId,
        event.rows,
        event.page,
        searchProgramName.value,
        event.sortField,
        event.sortOrder,
      );
    };
    const goToSearchProgramName = async () => {
      await getProgramsSummaryList(
        props.institutionId,
        currentPageSize.value ? currentPageSize.value : DEFAULT_PAGE_LIMIT,
        DEFAULT_PAGE_NUMBER,
        searchProgramName.value,
      );
    };
    return {
      institutionProgramsSummary,
      goToViewProgramDetail,
      DEFAULT_PAGE_LIMIT,
      pageSortEvent,
      goToSearchProgramName,
      searchProgramName,
      loading,
      ProgramSummaryFields,
      PAGINATION_LIST,
      LayoutTemplates,
    };
  },
});
</script>
