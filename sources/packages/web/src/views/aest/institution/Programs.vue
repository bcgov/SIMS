<template>
  <tab-container>
    <body-header-container>
      <template #header>
        <body-header
          title="All Programs"
          :recordsCount="institutionProgramsSummary.count"
        >
          <template #actions>
            <v-row>
              <v-col>
                <v-text-field
                  density="compact"
                  v-model="searchProgramName"
                  label="Search Program Name"
                  variant="outlined"
                  @keyup.enter="goToSearch()"
                  prepend-inner-icon="mdi-magnify"
                  hide-details="auto" /></v-col
              ><v-col>
                <v-text-field
                  density="compact"
                  v-model="searchLocationName"
                  label="Search Location Name"
                  variant="outlined"
                  @keyup.enter="goToSearch()"
                  prepend-inner-icon="mdi-magnify"
                  hide-details="auto"
              /></v-col>
              <v-col>
                <v-select
                  density="compact"
                  v-model="searchProgramStatus"
                  label="Search Program Status"
                  hide-details="auto"
                  :items="programStatusItems"
                  multiple
                  variant="outlined"
                >
                  <template #selection="{ item }">
                    <v-chip>
                      <span>{{ item.title }}</span>
                    </v-chip>
                  </template>
                </v-select>
              </v-col>
              <v-col cols="1">
                <v-btn
                  color="primary"
                  class="p-button-raised"
                  @click="goToSearch()"
                >
                  Search
                </v-btn>
              </v-col>
            </v-row>
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
  ProgramStatus,
} from "@/types";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import StatusChipProgram from "@/components/generic/StatusChipProgram.vue";
import { EducationProgramService } from "@/services/EducationProgramService";

const INACTIVE_PROGRAM = "Inactive";

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
    const searchLocationName = ref("");
    const currentPage = ref();
    const currentPageLimit = ref();
    const loading = ref(true);
    const programStatusItems = ref([
      ProgramStatus.Approved,
      ProgramStatus.Pending,
      ProgramStatus.Declined,
      INACTIVE_PROGRAM,
    ]);
    const searchProgramStatus = ref([
      ProgramStatus.Approved,
      ProgramStatus.Pending,
      ProgramStatus.Declined,
      INACTIVE_PROGRAM,
    ]);
    const getProgramsSummaryList = async (
      institutionId: number,
      rowsPerPage: number,
      page: number,
      sortColumn?: ProgramSummaryFields,
      sortOrder?: DataTableSortByOrder,
    ) => {
      try {
        loading.value = true;
        const statusSearchList = JSON.parse(
          JSON.stringify(searchProgramStatus.value),
        );
        const searchInactiveProgram = statusSearchList.indexOf("Inactive") > -1;
        if (searchInactiveProgram) {
          statusSearchList.splice(statusSearchList.indexOf("Inactive"), 1);
        }
        institutionProgramsSummary.value =
          await EducationProgramService.shared.getProgramsSummaryByInstitutionId(
            institutionId,
            {
              searchCriteria: {
                programNameSearch: searchProgramName.value,
                locationNameSearch: searchLocationName.value,
                statusSearch: statusSearchList,
                inactiveProgramSearch: searchInactiveProgram,
              },
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
        event.itemsPerPage,
        event.page,
        sortByOptions?.key as ProgramSummaryFields,
        sortByOptions?.order,
      );
    };
    const goToSearch = async () => {
      await getProgramsSummaryList(
        props.institutionId,
        currentPageLimit.value ?? DEFAULT_PAGE_LIMIT,
        currentPage.value ?? DEFAULT_DATATABLE_PAGE_NUMBER,
      );
    };
    return {
      institutionProgramsSummary,
      goToViewProgramDetail,
      DEFAULT_PAGE_LIMIT,
      pageSortEvent,
      goToSearch,
      programStatusItems,
      searchProgramName,
      searchLocationName,
      searchProgramStatus,
      loading,
      ProgramSummaryFields,
      ProgramHeaders,
      ITEMS_PER_PAGE,
    };
  },
});
</script>
