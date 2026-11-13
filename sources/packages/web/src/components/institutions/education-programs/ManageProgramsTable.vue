<template>
  <search-table
    v-model="searchBox"
    search-label="Search program name or SABC code or CIP"
    :loading="loading"
    @search="searchProgramTable"
  >
    <template #prepend-search>
      <program-year-status-filters
        class="mb-2"
        v-model:program-year-id="selectedProgramYearId"
        v-model:status-filters="statusFilters"
        :loading="loading"
        @initialized="programYearFiltersInitialized"
        @filters-changed="filtersChanged"
      />
    </template>
    <toggle-content
      :toggled="!programAndCount?.count && !loading"
      :message="noProgramsMessage"
    >
      <v-data-table-server
        v-if="programAndCount?.count"
        :headers="ManageProgramSummaryHeaders"
        :items="programAndCount?.results"
        :items-length="programAndCount?.count"
        :loading="loading"
        :items-per-page="DEFAULT_PAGE_LIMIT"
        :items-per-page-options="ITEMS_PER_PAGE"
        v-model:sort-by="sortBy"
        :mobile="isMobile"
        @update:options="paginationAndSortEvent"
      >
        <template #loading>
          <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
        </template>
        <template #[`item.programName`]="{ item }">
          {{ item.name }}
        </template>
        <template #[`item.credentialType`]="{ item }">
          {{ item.credentialTypeToDisplay }}
        </template>
        <template #[`item.cipCode`]="{ item }">
          {{ item.cipCode }}
        </template>
        <template #[`item.sabcCode`]="{ item }">
          {{ emptyStringFiller(item.sabcCode) }}
        </template>
        <template #[`item.programStatus`]="{ item }">
          <status-chip-program
            :status="item.programStatus"
            :is-active="item.isActive && !item.isExpired"
          ></status-chip-program>
        </template>
        <template #[`item.renewal`]="{ item }">
          <v-btn
            v-if="item.renewalStatus === ProgramRenewalStatus.Available"
            color="primary"
            :to="getRenewProgramRoute(item.id)"
            >Renew</v-btn
          >
          <span v-else class="text-body-2 text-medium-emphasis text-no-wrap">
            <v-icon
              :icon="
                item.renewalStatus === ProgramRenewalStatus.Renewed
                  ? 'fa:fas fa-check'
                  : 'fa:fas fa-clock'
              "
              size="14"
              class="mr-1"
            />
            {{ item.renewalStatus }}
          </span>
        </template>
        <template #[`item.programId`]="{ item }">
          <v-btn
            color="primary"
            variant="outlined"
            :to="getViewProgramRoute(item.id)"
            >View</v-btn
          >
        </template>
      </v-data-table-server>
    </toggle-content>
  </search-table>
</template>
<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useDisplay } from "vuetify";
import type { RouteLocationRaw } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import StatusChipProgram from "@/components/generic/StatusChipProgram.vue";
import ProgramYearStatusFilters from "@/components/institutions/education-programs/ProgramYearStatusFilters.vue";
import { EducationProgramService } from "@/services/EducationProgramService";
import type { DataTableOptions, ProgramStatusFilters } from "@/types";
import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  DEFAULT_DATATABLE_PAGE_NUMBER,
  ProgramSummaryFields,
  ManageProgramSummaryHeaders,
  DataTableSortByOrder,
} from "@/types";
import { ProgramRenewalStatus } from "@/services/http/dto";
import type {
  EducationProgramManagerDetailsAPIOutDTO,
  EducationProgramYearAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import { useFormatters, useSnackBar } from "@/composables";

interface ManageProgramsTableProps {
  /**
   * Program year to be selected by default, when provided.
   */
  programYearId?: number;
}

const props = defineProps<ManageProgramsTableProps>();

const emit = defineEmits<{
  // Program year or status filters changed by the user.
  // Provides the currently selected program year id, if any.
  filtersChanged: [programYearId?: number | null];
}>();

/**
 * Total of programs found for the current program year and filters.
 */
const recordsCount = defineModel<number | undefined>("recordsCount");

const { emptyStringFiller } = useFormatters();
const snackBar = useSnackBar();
const { mobile: isMobile } = useDisplay();
const programAndCount = ref(
  {} as
    | PaginatedResultsAPIOutDTO<EducationProgramManagerDetailsAPIOutDTO>
    | undefined,
);
const loading = ref(false);
const searchBox = ref("");
const sortBy = ref([
  {
    key: ProgramSummaryFields.ProgramStatus,
    order: DataTableSortByOrder.ASC,
  },
]);
/**
 * Status and renewal filters selected in the filters component.
 */
const statusFilters = ref<ProgramStatusFilters>({
  inactiveProgramSearch: false,
  renewedProgramSearch: false,
  notRenewedProgramSearch: false,
});
const currentPage = ref();
const currentPageLimit = ref();
/**
 * Initially set from the provided program year, when available, and validated by the filters component.
 */
const selectedProgramYearId = ref<number | null | undefined>(
  props.programYearId,
);
/**
 * Program year selected in the filters component.
 */
const selectedProgramYear = ref<EducationProgramYearAPIOutDTO>();

// Keeps the records count in sync with the programs loaded.
watch(
  () => programAndCount.value?.count,
  (count) => {
    recordsCount.value = count;
  },
);

/**
 * Message displayed when there are no programs to be listed.
 * Distinguishes a program year without programs from a program year
 * whose programs do not match the search or status filters.
 */
const noProgramsMessage = computed(() => {
  if (!selectedProgramYear.value) {
    return "Select a program year to view its programs.";
  }
  const programYear = selectedProgramYear.value.description;
  // Any status selection other than "All" narrows the programs listed.
  const hasAdditionalFilters =
    !!searchBox.value || Object.values(statusFilters.value).some(Boolean);
  if (hasAdditionalFilters) {
    return `No programs match your search or filters for the ${programYear} program year.`;
  }
  return `There are no programs for the ${programYear} program year.`;
});

/**
 * Builds the search criteria object from the current search box and status
 * filter values, used consistently across search and pagination/sort events.
 * @returns The search criteria object reflecting the current filter state.
 */
const getSearchCriteria = () => ({
  searchCriteria: searchBox.value,
  ...statusFilters.value,
});

/**
 * Function to load program list and count for the program year.
 * @param page page number, if nothing passed then DEFAULT_DATATABLE_PAGE_NUMBER.
 * @param pageCount page limit, if nothing passed then DEFAULT_PAGE_LIMIT.
 * @param sortField sort field.
 * @param sortOrder sort order.
 */
const loadPrograms = async (
  page = DEFAULT_DATATABLE_PAGE_NUMBER,
  pageCount = DEFAULT_PAGE_LIMIT,
  sortField?: string,
  sortOrder?: DataTableSortByOrder,
) => {
  if (!selectedProgramYearId.value) {
    snackBar.warn("Please select a program year to load programs.");
    return;
  }
  loading.value = true;
  try {
    programAndCount.value =
      await EducationProgramService.shared.getProgramsForProgramYear(
        selectedProgramYearId.value,
        {
          searchCriteria: getSearchCriteria(),
          sortField,
          sortOrder,
          page,
          pageLimit: pageCount,
        },
      );
  } catch {
    snackBar.error("Unexpected error while loading programs.");
  } finally {
    loading.value = false;
  }
};

// Pagination sort event callback.
const paginationAndSortEvent = async (event: DataTableOptions) => {
  currentPage.value = event.page;
  currentPageLimit.value = event.itemsPerPage;
  const [sortByOptions] = event.sortBy;
  await loadPrograms(
    event.page,
    event.itemsPerPage,
    sortByOptions?.key,
    sortByOptions?.order,
  );
};

/**
 * Search the program table based on the current search criteria.
 */
const searchProgramTable = async () => {
  programAndCount.value = undefined;
  const [sortByOptions] = sortBy.value;
  await loadPrograms(
    currentPage.value ?? DEFAULT_DATATABLE_PAGE_NUMBER,
    currentPageLimit.value ?? DEFAULT_PAGE_LIMIT,
    sortByOptions?.key,
    sortByOptions?.order,
  );
};

/**
 * Route to the renew program page for the next program year.
 * Used as a link target to allow the page to be opened in a new tab.
 * @param programId program to be renewed.
 * @returns renew program route location.
 */
const getRenewProgramRoute = (programId: number): RouteLocationRaw => ({
  name: InstitutionRoutesConst.RENEW_PROGRAM,
  params: {
    programId,
  },
  // Allows the renew page to navigate back keeping the current program year selected.
  query: {
    programYearId: selectedProgramYearId.value,
  },
});

/**
 * Route to the view program page.
 * Used as a link target to allow the page to be opened in a new tab.
 * @param programId program to be viewed.
 * @returns view program route location.
 */
const getViewProgramRoute = (programId: number): RouteLocationRaw => ({
  name: InstitutionRoutesConst.VIEW_PROGRAM,
  params: { programId },
  // Allows the view page to navigate back keeping the current program year selected.
  query: {
    programYearId: selectedProgramYearId.value,
  },
});

/**
 * Reload the programs from the first page when the program year or status filters change.
 * @param programYear currently selected program year, if any.
 */
const filtersChanged = async (programYear?: EducationProgramYearAPIOutDTO) => {
  selectedProgramYear.value = programYear;
  currentPage.value = undefined;
  emit("filtersChanged", selectedProgramYearId.value);
  await searchProgramTable();
};

/**
 * Loads the programs once the filters component is initialized, when a
 * valid program year was provided.
 * @param programYear initially selected program year, if any.
 */
const programYearFiltersInitialized = async (
  programYear?: EducationProgramYearAPIOutDTO,
) => {
  selectedProgramYear.value = programYear;
  if (programYear) {
    await searchProgramTable();
  }
};
</script>
