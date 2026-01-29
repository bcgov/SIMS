<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator title="Institution requests" sub-title="Programs" />
    </template>
    <body-header
      title="Pending programs"
      :records-count="programsAndCount?.count"
    >
      <template #subtitle>
        Program requests that require Ministry review.
      </template>
      <template #actions>
        <v-text-field
          density="compact"
          label="Search program or institution name"
          variant="outlined"
          v-model="searchCriteria"
          @keyup.enter="searchPrograms"
          prepend-inner-icon="mdi-magnify"
          hide-details="auto"
        >
        </v-text-field>
      </template>
    </body-header>
    <content-group>
      <toggle-content :toggled="!programsAndCount?.count">
        <v-data-table-server
          :headers="PendingProgramsHeaders"
          :items="programsAndCount?.results"
          :items-length="programsAndCount?.count"
          :loading="loading"
          item-value="id"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          :mobile="isMobile"
          @update:options="pageSortEvent"
        >
          <template #[`item.institutionOperatingName`]="{ item }">
            {{ item.institutionOperatingName }}
          </template>
          <template #[`item.programName`]="{ item }">
            {{ item.programName }}
          </template>
          <template #[`item.submittedDate`]="{ item }">
            {{ dateOnlyLongString(item.submittedDate) }}
          </template>
          <template #[`item.actions`]="{ item }">
            <v-btn color="primary" @click="viewProgram(item)">View</v-btn>
          </template>
        </v-data-table-server>
      </toggle-content>
    </content-group>
  </full-page-container>
</template>

<script lang="ts">
import { useFormatters, useSnackBar } from "@/composables";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import router from "@/router";
import { EducationProgramService } from "@/services/EducationProgramService";
import { EducationProgramPendingAPIOutDTO } from "@/services/http/dto";
import {
  PaginatedResults,
  DEFAULT_DATATABLE_PAGE_NUMBER,
  DEFAULT_PAGE_LIMIT,
  DataTableSortByOrder,
  DataTableOptions,
  ITEMS_PER_PAGE,
  PendingProgramsHeaders,
  PaginationOptions,
} from "@/types";
import { defineComponent, onMounted, ref } from "vue";
import { useDisplay } from "vuetify";

const DEFAULT_SORT_FIELD = "submittedDate";

export default defineComponent({
  setup() {
    const loading = ref(false);
    const searchCriteria = ref("");
    const { dateOnlyLongString } = useFormatters();
    const { mobile: isMobile } = useDisplay();
    const snackBar = useSnackBar();

    const programsAndCount = ref(
      {} as PaginatedResults<EducationProgramPendingAPIOutDTO>,
    );

    /**
     * Current state of the pagination.
     */
    const currentPagination: PaginationOptions = {
      page: DEFAULT_DATATABLE_PAGE_NUMBER,
      pageLimit: DEFAULT_PAGE_LIMIT,
      sortField: DEFAULT_SORT_FIELD,
      sortOrder: DataTableSortByOrder.ASC,
    };

    /**
     * Loads pending programs for Ministry review.
     */
    const getPrograms = async () => {
      try {
        loading.value = true;
        programsAndCount.value =
          await EducationProgramService.shared.getPendingPrograms({
            searchCriteria: searchCriteria.value,
            ...currentPagination,
          });
      } catch {
        snackBar.error("Unexpected error while loading Programs.");
      } finally {
        loading.value = false;
      }
    };

    onMounted(async () => {
      await getPrograms();
    });

    /**
     * Page/Sort event handler.
     * @param event The data table page/sort event.
     */
    const pageSortEvent = async (event: DataTableOptions) => {
      currentPagination.page = event.page;
      currentPagination.pageLimit = event.itemsPerPage;
      if (event.sortBy.length) {
        const [sortBy] = event.sortBy;
        currentPagination.sortField = sortBy.key;
        currentPagination.sortOrder = sortBy.order;
      } else {
        // Sorting was removed, reset to default.
        currentPagination.sortField = DEFAULT_SORT_FIELD;
        currentPagination.sortOrder = DataTableSortByOrder.ASC;
      }
      await getPrograms();
    };

    /**
     * Search program table.
     */
    const searchPrograms = async () => {
      await getPrograms();
    };

    /**
     * Navigate to View the Program.
     * @param item the selected Program.
     */
    const viewProgram = (item: EducationProgramPendingAPIOutDTO) => {
      router.push({
        name: AESTRoutesConst.PROGRAM_DETAILS,
        params: {
          programId: item.id,
          institutionId: item.institutionId,
          locationId: item.locationId,
        },
      });
    };

    return {
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      PendingProgramsHeaders,
      dateOnlyLongString,
      pageSortEvent,
      programsAndCount,
      loading,
      searchCriteria,
      searchPrograms,
      viewProgram,
      isMobile,
    };
  },
});
</script>
