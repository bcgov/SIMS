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
        >
          <v-data-table-server
            v-if="institutionProgramsSummary?.count"
            :headers="ProgramHeaders"
            :items="institutionProgramsSummary?.results"
            :items-length="institutionProgramsSummary?.count"
            :loading="loading"
            :items-per-page="DEFAULT_PAGE_LIMIT"
            :items-per-page-options="ITEMS_PER_PAGE"
            @update:options="pageSortEvent"
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
                color="primary"
                @click="goToViewProgramDetail(item.programId, item.locationId)"
                >View</v-btn
              >
            </template>
          </v-data-table-server>
        </toggle-content>
      </content-group>
    </body-header-container>
  </tab-container>
</template>

<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import { useRouter } from "vue-router";
import {
  ProgramSummaryFields,
  DEFAULT_PAGE_LIMIT,
  PaginatedResults,
  EducationProgramsSummary,
  ProgramHeaders,
  ITEMS_PER_PAGE,
  DataTableOptions,
  DataTableSortByOrder,
  DEFAULT_DATATABLE_PAGE_NUMBER,
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
    const currentPage = ref();
    const currentPageLimit = ref();
    const loading = ref(true);

    const getProgramsSummaryList = async (
      institutionId: number,
      programName: string,
      sortColumn?: ProgramSummaryFields,
      sortOrder?: DataTableSortByOrder,
      rowsPerPage = DEFAULT_PAGE_LIMIT,
      page = DEFAULT_DATATABLE_PAGE_NUMBER,
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
        searchProgramName.value,
        undefined,
        undefined,
        DEFAULT_PAGE_LIMIT,
        DEFAULT_DATATABLE_PAGE_NUMBER,
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
    const pageSortEvent = async (event: DataTableOptions) => {
      currentPage.value = event.page;
      currentPageLimit.value = event.itemsPerPage;
      const [sortByOptions] = event.sortBy;
      await getProgramsSummaryList(
        props.institutionId,
        searchProgramName.value,
        sortByOptions?.key as ProgramSummaryFields,
        sortByOptions?.order,
        event.itemsPerPage,
        event.page,
      );
    };
    const goToSearchProgramName = async () => {
      await getProgramsSummaryList(
        props.institutionId,
        searchProgramName.value,
        undefined,
        undefined,
        currentPageLimit.value ?? DEFAULT_PAGE_LIMIT,
        currentPage.value ?? DEFAULT_DATATABLE_PAGE_NUMBER,
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
      ProgramHeaders,
      ITEMS_PER_PAGE,
    };
  },
});
</script>
