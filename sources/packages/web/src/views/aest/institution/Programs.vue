<template>
  <content-group>
    <p class="category-header-large color-blue">
      All Programs ({{ institutionProgramsSummary.programsCount }})
    </p>
    <InputText
      name="searchProgramName"
      v-model="searchProgramName"
      placeholder="Search Program Name"
    />
    <v-btn
      :disabled="!searchProgramName"
      class="ml-5"
      color="primary"
      @click="goToSearchProgramName(searchProgramName)"
      >Search</v-btn
    >
    <v-btn class="ml-5" color="primary" @click="goToSearchProgramName('')"
      >Clear Search</v-btn
    >
    <content-group v-if="programsFound">
      <DataTable
        :value="institutionProgramsSummary.programsSummary"
        :lazy="true"
        :paginator="true"
        :rows="defaultNoOfRows"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        :totalRecords="institutionProgramsSummary.programsCount"
        @page="onPage($event)"
        @sort="onSort($event)"
        :loading="loading"
      >
        <Column field="submittedDate" header="Date Submitted" :sortable="true">
          <template #body="slotProps">
            <div class="p-text-capitalize">
              {{ slotProps.data.submittedDate }}
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
    const defaultPage = 0;
    const defaultNoOfRows = 2;
    const defaultSortOrder = -1;
    const loading = ref(false);
    onMounted(async () => {
      institutionProgramsSummary.value = await InstitutionService.shared.getPaginatedAESTInstitutionProgramsSummary(
        props.institutionId,
        defaultNoOfRows,
        defaultPage,
        defaultSortOrder,
        searchProgramName.value,
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

    const onPage = async (event: any) => {
      loading.value = true;
      institutionProgramsSummary.value = await InstitutionService.shared.getPaginatedAESTInstitutionProgramsSummary(
        props.institutionId,
        event.rows,
        event.rows * event.page,
        event.sortOrder,
        searchProgramName.value,
      );
      loading.value = false;
    };
    const onSort = async (event: any) => {
      loading.value = true;
      institutionProgramsSummary.value = await InstitutionService.shared.getPaginatedAESTInstitutionProgramsSummary(
        props.institutionId,
        event.rows,
        event.page ? event.rows * event.page : event.rows * 0,
        event.sortOrder,
        searchProgramName.value,
      );
      loading.value = false;
    };
    const goToSearchProgramName = async (programName: string) => {
      loading.value = true;
      searchProgramName.value = programName;
      institutionProgramsSummary.value = await InstitutionService.shared.getPaginatedAESTInstitutionProgramsSummary(
        props.institutionId,
        defaultNoOfRows,
        defaultPage,
        defaultSortOrder,
        programName,
      );
      if (institutionProgramsSummary.value.programsSummary.length === 0) {
        toast.warn(
          "No Programs found",
          "No Programs found for the Institution",
        );
      }
      loading.value = false;
    };
    return {
      institutionProgramsSummary,
      programsFound,
      goToViewProgramDetail,
      getProgramStatusColorClass,
      defaultNoOfRows,
      onPage,
      onSort,
      goToSearchProgramName,
      searchProgramName,
      loading,
    };
  },
};
</script>
