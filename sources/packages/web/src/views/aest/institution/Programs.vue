<template>
  <content-group>
    <p class="category-header-large color-blue">
      All Programs ({{ institutionProgramsSummary.programsCount }})
      <v-row class="float-right">
        <v-col>
          <InputText
            name="searchProgramName"
            v-model="searchProgramName"
            placeholder="Search Program Name"
          />
        </v-col>
        <v-col>
          <v-btn
            color="primary"
            @click="goToSearchProgramName(searchProgramName, $event)"
            >Search</v-btn
          >
        </v-col>
        <v-col>
          <v-btn color="primary" @click="goToSearchProgramName('')"
            >Clear</v-btn
          >
        </v-col>
      </v-row>
    </p>
    <content-group v-if="programsFound">
      <DataTable
        :value="institutionProgramsSummary.programsSummary"
        :lazy="true"
        :paginator="true"
        :rows="DEFAULT_ROW_SIZE"
        :rowsPerPageOptions="[10, 20, 50]"
        :totalRecords="institutionProgramsSummary.programsCount"
        @page="pageSortEvent($event)"
        @sort="pageSortEvent($event)"
        :loading="loading"
      >
        <Column field="submittedDate" header="Date Submitted" :sortable="true">
          <template #body="slotProps">
            <div class="p-text-capitalize">
              {{ slotProps.data.formattedSubmittedDate }}
            </div>
          </template>
        </Column>
        <Column field="programName" header="Program Name">
          <template #body="slotProps">
            <div class="p-text-capitalize">
              {{ slotProps.data.programName }}
            </div>
          </template>
        </Column>
        <Column field="locationName" header="Location">
          <template #body="slotProps">
            <div class="p-text-capitalize">
              {{ slotProps.data.locationName }}
            </div>
          </template>
        </Column>
        <Column field="offeringsCount" header="Study periods">
          <template #body="slotProps">
            <div class="p-text-capitalize">
              {{ slotProps.data.offeringsCount }}
            </div>
          </template>
        </Column>
        <Column field="programStatus" header="Status"
          ><template #body="slotProps">
            <Chip
              :label="slotProps.data.programStatus"
              class="p-mr-2 p-mb-2 p-text-uppercase"
              :class="
                getProgramStatusColorClass(slotProps.data.programStatus)
              "/></template
        ></Column>
        <Column>
          <template #body="slotProps">
            <v-btn
              outlined
              @click="goToViewProgramDetail(slotProps.data.programId)"
              >View</v-btn
            >
          </template>
        </Column>
      </DataTable>
    </content-group>
  </content-group>
</template>

<script lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { InstitutionService } from "@/services/InstitutionService";
import ContentGroup from "@/components/generic/ContentGroup.vue";
import {
  AESTInstitutionProgramsSummaryPaginatedDto,
  ApprovalStatus,
  SortDBOrder,
} from "@/types";
import { useToastMessage } from "@/composables";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
export default {
  components: { ContentGroup },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const toast = useToastMessage();
    const router = useRouter();
    const institutionProgramsSummary = ref(
      {} as AESTInstitutionProgramsSummaryPaginatedDto,
    );
    const searchProgramName = ref("");
    const DEFAULT_PAGE = 0;
    const DEFAULT_ROW_SIZE = 10;
    const DEFAULT_SORT_COLUMN = "submittedDate";
    const DEFAULT_SORT_ORDER = SortDBOrder.DESC;
    const loading = ref(false);
    const getProgramsSummaryList = async (
      institutionId: number,
      rowsPerPage: number,
      page: number,
      sortColumn: string,
      sortOrder: SortDBOrder,
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
        if (institutionProgramsSummary.value.programsSummary.length === 0) {
          toast.warn(
            "No Programs found",
            "No Programs found for the Institution/ Search Criteria",
          );
        }
      } finally {
        loading.value = false;
      }
    };
    onMounted(async () => {
      await getProgramsSummaryList(
        props.institutionId,
        DEFAULT_ROW_SIZE,
        DEFAULT_PAGE,
        DEFAULT_SORT_COLUMN,
        DEFAULT_SORT_ORDER,
        searchProgramName.value,
      );
    });
    const programsFound = computed(() => {
      return institutionProgramsSummary.value.programsCount > 0;
    });
    const goToViewProgramDetail = (programId: number) => {
      router.push({
        name: AESTRoutesConst.PROGRAM_DETAILS,
        params: { programId: programId },
      });
    };
    const getProgramStatusColorClass = (status: ApprovalStatus) => {
      switch (status) {
        case ApprovalStatus.approved:
          return "bg-info text-white";
        case ApprovalStatus.pending:
          return "bg-warning text-white";
        default:
          return "";
      }
    };
    const pageSortEvent = async (event: any) => {
      await getProgramsSummaryList(
        props.institutionId,
        event.rows,
        event.page,
        event.sortField,
        event.sortOrder,
        searchProgramName.value,
      );
    };
    const goToSearchProgramName = async (
      programName: string,
      ...event: any
    ) => {
      await getProgramsSummaryList(
        props.institutionId,
        event.rows,
        DEFAULT_PAGE,
        DEFAULT_SORT_COLUMN,
        DEFAULT_SORT_ORDER,
        programName,
      );
    };
    return {
      institutionProgramsSummary,
      programsFound,
      goToViewProgramDetail,
      getProgramStatusColorClass,
      DEFAULT_ROW_SIZE,
      pageSortEvent,
      goToSearchProgramName,
      searchProgramName,
      loading,
    };
  },
};
</script>
