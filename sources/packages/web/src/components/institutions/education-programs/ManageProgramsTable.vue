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
            :is-active="item.isActive"
          ></status-chip-program>
        </template>
        <template #[`item.renewal`]="{ item }">
          <program-renewal-action
            v-if="selectedProgramYearId"
            :program-id="item.id"
            :renewal-status="item.renewalStatus"
            :is-active="item.isActive"
            :program-year-id="selectedProgramYearId"
            :allow-renewal="allowRenewal"
          />
        </template>
        <template #[`item.programId`]="{ item }">
          <div class="d-flex flex-nowrap gc-2">
            <v-btn
              color="primary"
              variant="outlined"
              :to="getViewProgramRoute(item.id)"
              >View</v-btn
            >
            <v-btn
              v-if="allowEdit && allowProgramChanges && item.isActive"
              color="primary"
              variant="outlined"
              :disabled="!canModifyPrograms"
              :to="getEditProgramRoute(item.id)"
              >Edit</v-btn
            >
          </div>
        </template>
      </v-data-table-server>
    </toggle-content>
  </search-table>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useDisplay } from "vuetify";
import type { RouteLocationRaw } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import StatusChipProgram from "@/components/generic/StatusChipProgram.vue";
import ProgramYearStatusFilters from "@/components/institutions/education-programs/ProgramYearStatusFilters.vue";
import ProgramRenewalAction from "@/components/institutions/education-programs/ProgramRenewalAction.vue";
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
import type {
  EducationProgramManagerDetailsAPIOutDTO,
  EducationProgramYearAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import {
  useEducationProgramYears,
  useFormatters,
  useInstitutionAuth,
  useSnackBar,
} from "@/composables";

interface ManageProgramsTableProps {
  /**
   * Program year to be selected by default, when provided.
   */
  programYearId?: number;
  /**
   * Route to the page where the program is viewed.
   * Used as a link target to allow the page to be opened in a new tab.
   * @param programId program to be viewed.
   * @returns view program route location.
   */
  getViewProgramRoute: (programId: number) => RouteLocationRaw;
  /**
   * Indicates if the renew action can be displayed. When not allowed, only the
   * renewal status is displayed, as for users not allowed to modify programs.
   */
  allowRenewal?: boolean;
  /**
   * Indicates if the edit action can be displayed.
   */
  allowEdit?: boolean;
}

const props = withDefaults(defineProps<ManageProgramsTableProps>(), {
  programYearId: undefined,
  allowRenewal: false,
  allowEdit: false,
});

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
const { loadEducationProgramYears } = useEducationProgramYears();
const { canModifyPrograms } = useInstitutionAuth();
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
/**
 * Programs listed are all from the selected program year, which must have an active
 * program configuration for its programs to be edited, matching the API validation.
 */
const allowProgramChanges = computed(
  () => !!selectedProgramYear.value?.hasActiveProgramConfiguration,
);

// Selects the provided program year when it changes, for instance, when the
// route changes while the page is reused. When no program year is provided,
// the current selection is kept.
watch(
  () => props.programYearId,
  (programYearId) => {
    if (programYearId) {
      selectedProgramYearId.value = programYearId;
    }
  },
);

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
 * Route to the edit program page.
 * Used as a link target to allow the page to be opened in a new tab.
 * @param programId program to be edited.
 * @returns edit program route location.
 */
const getEditProgramRoute = (programId: number): RouteLocationRaw => ({
  name: InstitutionRoutesConst.EDIT_PROGRAM,
  params: { programId },
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

onMounted(loadEducationProgramYears);
</script>
