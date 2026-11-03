<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator
        title="Manage Programs"
        sub-title="Manage programs for a program year"
      />
    </template>
    <body-header-container>
      <template #header>
        <body-header
          title="Education Programs"
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
      <search-table :loading="loading" @search="searchProgramTable">
        <template #prepend-search>
          <div class="d-flex ga-2">
            <v-select
              class="flex-grow-0"
              min-width="200"
              label="Program year"
              placeholder="Select year"
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
            <v-text-field
              density="compact"
              label="Search Program name or SABC program code or CIP"
              variant="outlined"
              v-model="searchBox"
              @keyup.enter="searchProgramTable"
              prepend-inner-icon="mdi-magnify"
              hide-details="auto"
            />
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
              <span v-else class="text-body-2 text-medium-emphasis text-no-wrap">
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
} from "@/types";
import type {
  EducationProgramManagerDetailsAPIOutDTO,
  EducationProgramYearAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import { useFormatters, useSnackBar } from "@/composables";

interface ManageProgramsProps {
  // Program year to be selected by default, when provided.
  programYearId?: number;
}

const props = defineProps<ManageProgramsProps>();
const { emptyStringFiller } = useFormatters();
const snackBar = useSnackBar();
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
          searchCriteria: searchBox.value,
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
