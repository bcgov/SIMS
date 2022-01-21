<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <div class="mb-4">
        <span class="category-header-large color-blue">
          All Programs ({{ institutionProgramsSummary.programsCount }})
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
          <template #empty>
            <p class="text-center font-weight-bold">No records found.</p>
          </template>
          <Column
            field="submittedDate"
            header="Date Submitted"
            :sortable="true"
          >
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
              <status-badge
                :status="
                  getProgramStatusToGeneralStatus(slotProps.data.programStatus)
                "
              ></status-badge> </template
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
    </div>
  </v-card>
</template>

<script lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { InstitutionService } from "@/services/InstitutionService";
import ContentGroup from "@/components/generic/ContentGroup.vue";
import {
  AESTInstitutionProgramsSummaryPaginatedDto,
  SortDBOrder,
} from "@/types";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import StatusBadge from "@/components/generic/StatusBadge.vue";
import { useFormatStatuses } from "@/composables";

export default {
  components: { ContentGroup, StatusBadge },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const institutionProgramsSummary = ref(
      {} as AESTInstitutionProgramsSummaryPaginatedDto,
    );
    const searchProgramName = ref("");
    const DEFAULT_PAGE = 0;
    const DEFAULT_ROW_SIZE = 10;
    const currentPageSize = ref();
    const DEFAULT_SORT_COLUMN = "submittedDate";
    const DEFAULT_SORT_ORDER = SortDBOrder.DESC;
    const loading = ref(false);
    const { getProgramStatusToGeneralStatus } = useFormatStatuses();

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
    const goToViewProgramDetail = (programId: number) => {
      router.push({
        name: AESTRoutesConst.PROGRAM_DETAILS,
        params: { programId: programId },
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
        currentPageSize.value ? currentPageSize.value : DEFAULT_ROW_SIZE,
        DEFAULT_PAGE,
        DEFAULT_SORT_COLUMN,
        DEFAULT_SORT_ORDER,
        searchProgramName.value,
      );
    };
    return {
      institutionProgramsSummary,
      goToViewProgramDetail,
      DEFAULT_ROW_SIZE,
      pageSortEvent,
      goToSearchProgramName,
      searchProgramName,
      loading,
      getProgramStatusToGeneralStatus,
    };
  },
};
</script>
