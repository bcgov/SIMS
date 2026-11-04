<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator
        :title="institutionState?.operatingName"
        sub-title="Manage programs"
      />
    </template>
    <body-header-container>
      <template #header>
        <body-header
          title="Programs by Program Year"
          :records-count="programAndCount?.count"
        >
          <template #actions>
            <div class="d-flex justify-end">
              <v-menu>
                <template #activator="{ props: menuProps }">
                  <v-btn
                    color="primary"
                    v-bind="menuProps"
                    :disabled="!activeProgramYears.length"
                    prepend-icon="fa:fa fa-plus-circle"
                    append-icon="mdi-menu-down"
                  >
                    Create program
                  </v-btn>
                </template>
                <v-list
                  active-class="active-list-item"
                  density="compact"
                  bg-color="default"
                  color="primary"
                >
                  <v-list-item
                    v-for="programYear in activeProgramYears"
                    :key="programYear.id"
                    :value="programYear.id"
                    @click="goToCreateProgram(programYear.id)"
                  >
                    <v-list-item-title>
                      <span class="label-bold">{{
                        programYear.description
                      }}</span>
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </template>
        </body-header>
      </template>
      <search-table
        v-model="searchBox"
        search-label="Search Program name or SABC program code or CIP"
        :loading="loading"
        @search="searchProgramTable"
      >
        <template #prepend-search>
          <div class="d-flex ga-2">
            <v-select
              class="flex-grow-0 flex-shrink-0"
              width="280"
              clearable
              label="Program year"
              placeholder="Select a program year"
              persistent-placeholder
              density="compact"
              :items="programYears"
              item-title="description"
              item-value="id"
              v-model="selectedProgramYearId"
              @update:model-value="programConfigurationChanged"
              variant="outlined"
              hide-details="auto"
              prepend-inner-icon="mdi-calendar-range"
              :loading="loading"
              autofocus
            />
            <v-divider vertical />
            <v-btn-toggle
              :model-value="selectedStatuses"
              @update:model-value="handleStatusChange"
              multiple
              density="compact"
              class="flex-grow-1 flex-wrap align-self-center btn-toggle"
              selected-class="selected-btn-toggle"
            >
              <v-btn
                rounded="xl"
                :value="ALL_STATUS"
                color="primary"
                class="mr-2"
                >All</v-btn
              >
              <v-btn
                rounded="xl"
                :value="ProgramStatus.Approved"
                color="primary"
                class="mr-2"
                >Approved</v-btn
              >
              <v-btn
                rounded="xl"
                :value="ProgramStatus.Pending"
                color="primary"
                class="mr-2"
                >Pending</v-btn
              >
              <v-btn
                rounded="xl"
                :value="ProgramStatus.Declined"
                color="primary"
                class="mr-2"
                >Declined</v-btn
              >
              <v-btn
                rounded="xl"
                :value="INACTIVE_PROGRAM"
                color="primary"
                class="mr-2"
                >Inactive</v-btn
              >
              <v-btn
                rounded="xl"
                :value="RENEWED_PROGRAM"
                color="primary"
                class="mr-2"
                >Renewed</v-btn
              >
              <v-btn rounded="xl" :value="NOT_RENEWED_PROGRAM" color="primary"
                >Not Renewed</v-btn
              >
            </v-btn-toggle>
          </div>
        </template>
        <toggle-content
          :toggled="!programAndCount?.count"
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
                v-if="
                  !item.isRenewed && item.nextProgramConfigurationIdForRenewal
                "
                color="primary"
                @click="
                  goToRenewProgram(
                    item.id,
                    item.nextProgramConfigurationIdForRenewal,
                  )
                "
                >Renew</v-btn
              >
              <span
                v-else
                class="text-body-2 text-medium-emphasis text-no-wrap"
              >
                <v-icon
                  :icon="item.isRenewed ? 'fa:fas fa-check' : 'fa:fas fa-clock'"
                  size="14"
                  class="mr-1"
                />
                {{ item.isRenewed ? "Renewed" : "Not available" }}
              </span>
            </template>
            <template #[`item.programId`]="{ item }">
              <v-btn
                color="primary"
                variant="outlined"
                @click="goToViewProgram(item.id)"
                >View</v-btn
              >
            </template>
          </v-data-table-server>
        </toggle-content>
      </search-table>
    </body-header-container>
  </full-page-container>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useDisplay } from "vuetify";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import BodyHeaderContainer from "@/components/layouts/BodyHeaderContainer.vue";
import StatusChipProgram from "@/components/generic/StatusChipProgram.vue";
import { EducationProgramService } from "@/services/EducationProgramService";
import type { DataTableOptions } from "@/types";
import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  DEFAULT_DATATABLE_PAGE_NUMBER,
  ProgramSummaryFields,
  ManageProgramSummaryHeaders,
  DataTableSortByOrder,
  ProgramStatus,
} from "@/types";
import { INACTIVE_PROGRAM } from "@/constants";
import type {
  EducationProgramManagerDetailsAPIOutDTO,
  EducationProgramYearAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import { useFormatters, useInstitutionState, useSnackBar } from "@/composables";

interface ManageProgramsProps {
  // Program year to be selected by default, when provided.
  programYearId?: number;
}

const props = defineProps<ManageProgramsProps>();
const { emptyStringFiller } = useFormatters();
const snackBar = useSnackBar();
const { institutionState } = useInstitutionState();
const router = useRouter();
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
    key: ProgramSummaryFields.ProgramName,
    order: DataTableSortByOrder.ASC,
  },
]);
// Sentinel value used to represent the "All" filter state.
const ALL_STATUS = "All";
// Renewal filter values, listed along with the program statuses.
// Renewed programs are the ones already renewed into the next program year.
// When combined with statuses, the programs must match both filters.
const RENEWED_PROGRAM = "renewed";
const NOT_RENEWED_PROGRAM = "notRenewed";
const selectedStatuses = ref([ALL_STATUS]);
const currentPage = ref();
const currentPageLimit = ref();
// Program years with education program configurations available to be selected.
const programYears = ref<EducationProgramYearAPIOutDTO[]>([]);
// Education program configuration the programs are listed for.
const selectedProgramYearId = ref<number | null>();

/**
 * Program years with at least one active education program configuration,
 * available to have new programs created for.
 */
const activeProgramYears = computed(() =>
  programYears.value.filter(
    (programYear) => programYear.hasActiveProgramConfiguration,
  ),
);

/**
 * Message displayed when there are no programs to be listed.
 */
const noProgramsMessage = computed(() => {
  const programConfiguration = programYears.value.find(
    (configuration) => configuration.id === selectedProgramYearId.value,
  );
  if (!programConfiguration) {
    return "Select a program year to view its programs.";
  }
  return `Program year ${programConfiguration.description} does not have any programs yet`;
});

/**
 * Builds the search criteria object from the current search box and status
 * filter values, used consistently across search and pagination/sort events.
 * @returns The search criteria object reflecting the current filter state.
 */
const getSearchCriteria = () => {
  // Only actual program statuses are sent as the status search.
  const statusSearch = selectedStatuses.value.filter(
    (s) =>
      ![
        ALL_STATUS,
        INACTIVE_PROGRAM,
        RENEWED_PROGRAM,
        NOT_RENEWED_PROGRAM,
      ].includes(s),
  );
  return {
    searchCriteria: searchBox.value,
    inactiveProgramSearch: selectedStatuses.value.includes(INACTIVE_PROGRAM),
    renewedProgramSearch: selectedStatuses.value.includes(RENEWED_PROGRAM),
    notRenewedProgramSearch:
      selectedStatuses.value.includes(NOT_RENEWED_PROGRAM),
    ...(statusSearch.length ? { statusSearch } : {}),
  };
};

/**
 * Function to load program list and count for the program configuration.
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
  await loadPrograms(
    currentPage.value ?? DEFAULT_DATATABLE_PAGE_NUMBER,
    currentPageLimit.value ?? DEFAULT_PAGE_LIMIT,
  );
};

/**
 * Handles status filter changes from the toggle group, enforcing mutual
 * exclusivity between "All" and specific statuses, and reloading the table
 * when the effective selection changes.
 * @param newVal The new array of selected status values emitted by the toggle.
 */
const handleStatusChange = async (newVal: string[]) => {
  const oldVal = selectedStatuses.value;
  if (newVal.includes(ALL_STATUS) && newVal.length > 1) {
    // Clicking "All" while others are active clears them.
    // Clicking a status while "All" is active removes "All".
    selectedStatuses.value = oldVal.includes(ALL_STATUS)
      ? newVal.filter((s) => s !== ALL_STATUS)
      : [ALL_STATUS];
  } else if (newVal.length === 0) {
    // Nothing selected, fall back to "All".
    selectedStatuses.value = [ALL_STATUS];
  } else {
    selectedStatuses.value = newVal;
  }
  await searchProgramTable();
};

/**
 * Navigate to the renew program page for the next program year.
 * @param programId program to be renewed.
 * @param configurationId program configuration the program will be renewed for.
 */
const goToRenewProgram = (programId: number, configurationId: number) => {
  router.push({
    name: InstitutionRoutesConst.RENEW_PROGRAM,
    params: {
      programId,
      configurationId,
    },
    // Allows the renew page to navigate back keeping the current program year selected.
    query: {
      programYearId: selectedProgramYearId.value,
    },
  });
};

/**
 * Navigate to the view program page.
 * @param programId program to be viewed.
 */
const goToViewProgram = (programId: number) => {
  router.push({
    name: InstitutionRoutesConst.VIEW_PROGRAM,
    params: { programId },
    // Allows the view page to navigate back keeping the current program year selected.
    query: {
      programYearId: selectedProgramYearId.value,
    },
  });
};

/**
 * Navigate to the create program page for the program year.
 * @param programYearId program year the program will be created for.
 */
const goToCreateProgram = (programYearId: number) => {
  router.push({
    name: InstitutionRoutesConst.CREATE_PROGRAM,
    params: { programYearId },
  });
};

// Reload the programs from the first page when the program configuration changes.
const programConfigurationChanged = async () => {
  currentPage.value = undefined;
  // Keep the route in sync with the selected program configuration.
  await router.replace({
    name: InstitutionRoutesConst.MANAGE_PROGRAMS,
    params: { programYearId: selectedProgramYearId.value },
  });
  await searchProgramTable();
};

onMounted(async () => {
  programYears.value =
    await EducationProgramService.shared.getProgramYearsList();
  // No program year is selected by default, unless provided in the route,
  // otherwise the user must select one to list the programs.
  const isValidProgramYear = programYears.value.some(
    (programYear) => programYear.id === props.programYearId,
  );
  if (isValidProgramYear) {
    selectedProgramYearId.value = props.programYearId;
    await searchProgramTable();
  }
});
</script>
