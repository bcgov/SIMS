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
              variant="outlined"
              @keyup.enter="goToSearchProgramName()"
              prepend-inner-icon="mdi-magnify"
              hide-details="auto"
            />
          </template>
        </body-header>
      </template>
      <content-group>
        <toggle-content
          :toggled="!loading && !institutionProgramsSummary.count"
          message="No records found."
        >
          <v-data-table
            :headers="ProgramHeaders"
            :items="institutionProgramsSummary.results"
            :items-per-page="DEFAULT_PAGE_LIMIT"
            :items-per-page-options="ITEMS_PER_PAGE"
            :loading="loading"
          >
            <template #[`item.submittedDate`]="{ item }">
              {{ item.submittedDateFormatted }}
            </template>
            <template #[`item.programName`]="{ item }">
              {{ item.programName }}
            </template>
            <template #[`item.locationName`]="{ item }">
              {{ item.locationName }}
            </template>
            <template #[`item.totalOfferings`]="{ item }">
              {{ item.totalOfferings }}
            </template>
            <template #[`item.programStatus`]="{ item }">
              <status-chip-program
                :status="item.programStatus"
                :is-active="item.isActive && !item.isExpired"
              ></status-chip-program>
            </template>
            <template #[`item.action`]="{ item }">
              <v-btn
                variant="outlined"
                @click="goToViewProgramDetail(item.programId, item.locationId)"
                >View</v-btn
              >
            </template>
          </v-data-table>
        </toggle-content>
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
  DEFAULT_PAGE_LIMIT,
  PaginatedResults,
  EducationProgramsSummary,
  ProgramHeaders,
  ITEMS_PER_PAGE,
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
    const loading = ref(true);

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
      goToSearchProgramName,
      searchProgramName,
      loading,
      ProgramSummaryFields,
      ProgramHeaders,
      ITEMS_PER_PAGE,
    };
  },
});
</script>
