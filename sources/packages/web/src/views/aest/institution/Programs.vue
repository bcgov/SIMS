<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <div class="mb-4">
        <span class="category-header-large color-blue">
          All Programs ({{ institutionProgramsSummary.count }})
        </span>
        <div class="float-right">
          <InputText
            name="searchProgramName"
            v-model="searchProgramName"
            placeholder="Search Program Name"
            @keyup.enter="goToSearchProgramName()"
          />
          <v-btn
            class="ml-2 primary-btn-background"
            @click="goToSearchProgramName()"
            ><font-awesome-icon :icon="['fas', 'search']"
          /></v-btn>
        </div>
      </div>
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
                {{ slotProps.data.formattedSubmittedDate }}
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
          <Column :field="ProgramSummaryFields.ApprovalStatus" header="Status"
            ><template #body="slotProps">
              <program-status-chip
                :status="slotProps.data.programStatus"
              ></program-status-chip> </template
          ></Column>
          <Column>
            <template #body="slotProps">
              <v-btn
                outlined
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
    </div>
  </v-card>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { InstitutionService } from "@/services/InstitutionService";
import ContentGroup from "@/components/generic/ContentGroup.vue";
import {
  DataTableSortOrder,
  ProgramSummaryFields,
  DEFAULT_PAGE_NUMBER,
  PAGINATION_LIST,
  DEFAULT_PAGE_LIMIT,
  PaginatedResults,
  AESTInstitutionProgramsSummaryDto,
} from "@/types";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import ProgramStatusChip from "@/components/generic/ProgramStatusChip.vue";

export default {
  components: { ContentGroup, ProgramStatusChip },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const institutionProgramsSummary = ref(
      {} as PaginatedResults<AESTInstitutionProgramsSummaryDto>,
    );
    const searchProgramName = ref("");
    const currentPageSize = ref();
    const DEFAULT_SORT_COLUMN = ProgramSummaryFields.SubmittedDate;
    const DEFAULT_SORT_ORDER = DataTableSortOrder.DESC;
    const loading = ref(false);

    const getProgramsSummaryList = async (
      institutionId: number,
      rowsPerPage: number,
      page: number,
      sortColumn: string,
      sortOrder: DataTableSortOrder,
      programName: string,
    ) => {
      try {
        loading.value = true;
        searchProgramName.value = programName;
        institutionProgramsSummary.value = await InstitutionService.shared.getPaginatedAESTInstitutionProgramsSummary(
          institutionId,
          rowsPerPage,
          page,
          sortColumn,
          sortOrder,
          programName,
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
        DEFAULT_SORT_COLUMN,
        DEFAULT_SORT_ORDER,
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
        event.sortField,
        event.sortOrder,
        searchProgramName.value,
      );
    };
    const goToSearchProgramName = async () => {
      await getProgramsSummaryList(
        props.institutionId,
        currentPageSize.value ? currentPageSize.value : DEFAULT_PAGE_LIMIT,
        DEFAULT_PAGE_NUMBER,
        DEFAULT_SORT_COLUMN,
        DEFAULT_SORT_ORDER,
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
    };
  },
};
</script>
