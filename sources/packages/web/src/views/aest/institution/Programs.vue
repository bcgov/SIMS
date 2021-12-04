<template>
  <content-group>
    <p class="category-header-large color-blue">
      All Programs ({{ institutionProgramsSummary.programsCount }})
    </p>
    <content-group v-if="programsFound">
      <DataTable
        :value="institutionProgramsSummary.programsSummary"
        class="mt-4"
        currentPageReportTemplate="{{first}} - {{last}} of {{totalRecords}}"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[10, 20, 50]"
        v-model:filters="filters"
        filterDisplay="menu"
      >
        <template #filter>
          <span class="p-input-icon-right">
            <i class="pi pi-search" />
            <InputText
              type="text"
              v-model="filters['programName']"
              class="p-column-filter"
            />
          </span>
        </template>
        <template #empty>
          No customers found.
        </template>
        <template #loading>
          Loading customers data. Please wait.
        </template>
        <Column field="submittedDate" header="Date Submitted" :sortable="true">
          <template #body="slotProps">
            <div class="p-text-capitalize">
              {{ slotProps.data.submittedDate }}
            </div>
          </template>
        </Column>
        <Column
          field="programName"
          filterField="programName"
          header="Program Name"
        >
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
} from "@/types";
import { useToastMessage } from "@/composables";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { FilterMatchMode, FilterOperator } from "primevue/api";
export default {
  components: { ContentGroup },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        programName: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },
    };
  },
  setup(props: any) {
    const toast = useToastMessage();
    const router = useRouter();
    const institutionProgramsSummary = ref(
      {} as AESTInstitutionProgramsSummaryPaginatedDto,
    );
    onMounted(async () => {
      institutionProgramsSummary.value = await InstitutionService.shared.getPaginatedAESTInstitutionProgramsSummary(
        props.institutionId,
        10,
        0,
        "DESC",
        "",
      );
      if (institutionProgramsSummary.value.programsSummary.length === 0) {
        toast.warn(
          "No Programs found",
          "No Programs found for the Institution",
        );
      }
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
    return {
      institutionProgramsSummary,
      programsFound,
      goToViewProgramDetail,
      getProgramStatusColorClass,
    };
  },
};
</script>
