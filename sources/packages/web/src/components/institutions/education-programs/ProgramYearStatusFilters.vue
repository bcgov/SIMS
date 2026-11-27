<template>
  <!--
    The status filters are shown inline, next to the program year, when they
    fit in a single row. Otherwise, they wrap to a second row.
    Both elements grow to fill the available space, but the status filters have
    a much higher grow factor. When inline, the status filters take virtually
    all the free space and the program year keeps its width. When wrapped, each
    element is alone in its row and takes the full width.
  -->
  <div class="d-flex flex-wrap ga-2">
    <v-select
      class="flex-shrink-0 flex-grow-1"
      width="180"
      label="Program year"
      placeholder="Select year"
      persistent-placeholder
      density="compact"
      :items="educationProgramYears"
      item-title="description"
      item-value="id"
      :model-value="selectedProgramYear?.id"
      @update:model-value="programYearChanged"
      variant="outlined"
      hide-details="auto"
      prepend-inner-icon="mdi-calendar-range"
      :loading="loading || loadingEducationProgramYears"
      autofocus
    />
    <v-btn-toggle
      :model-value="selectedStatuses"
      @update:model-value="handleStatusChange"
      multiple
      density="compact"
      class="flex-wrap h-auto ga-2 align-self-center btn-toggle"
      style="flex-grow: 9999"
      selected-class="selected-btn-toggle"
    >
      <v-btn
        v-for="filter in STATUS_FILTERS"
        :key="filter.value"
        rounded="xl"
        height="36"
        :value="filter.value"
        color="primary"
        >{{ filter.label }}</v-btn
      >
    </v-btn-toggle>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";
import { ProgramStatus, type ProgramStatusFilters } from "@/types";
import { INACTIVE_PROGRAM } from "@/constants";
import type { EducationProgramYearAPIOutDTO } from "@/services/http/dto";
import { useEducationProgramYears } from "@/composables";

interface ProgramYearStatusFiltersProps {
  /**
   * Indicates the programs are being loaded.
   */
  loading?: boolean;
}

withDefaults(defineProps<ProgramYearStatusFiltersProps>(), {
  loading: false,
});

const emit = defineEmits<{
  // Program years loaded and the initial selection validated.
  // Provides the initially selected program year, if any.
  initialized: [programYear?: EducationProgramYearAPIOutDTO];
  // Program year or status filters changed by the user, or program year
  // changed by the parent. Provides the currently selected program year, if any.
  filtersChanged: [programYear?: EducationProgramYearAPIOutDTO];
}>();

// Program year selected. When the initial value is not one of the
// program years available, the selection is cleared.
const programYearId = defineModel<number | null | undefined>("programYearId");
// Status filters reflecting the current status toggle selection.
const statusFilters = defineModel<ProgramStatusFilters>("statusFilters", {
  default: () => ({
    inactiveProgramSearch: false,
    renewedProgramSearch: false,
    notRenewedProgramSearch: false,
  }),
});

// Program years with education program configurations available to be selected.
const {
  educationProgramYears,
  educationProgramYearsLoaded,
  loadingEducationProgramYears,
} = useEducationProgramYears();
// Sentinel value used to represent the "All" filter state.
const ALL_STATUS = "All";
// Renewal filter values, listed along with the program statuses.
// Renewed programs are the ones already renewed into the next program year.
// When combined with statuses, the programs must match both filters.
const RENEWED_PROGRAM = "renewed";
const NOT_RENEWED_PROGRAM = "notRenewed";
// Filters rendered in the status toggle group, in display order.
const STATUS_FILTERS = [
  { value: ALL_STATUS, label: "All" },
  { value: ProgramStatus.Approved, label: "Approved" },
  { value: ProgramStatus.Pending, label: "Pending" },
  { value: ProgramStatus.Declined, label: "Declined" },
  { value: INACTIVE_PROGRAM, label: "Inactive" },
  { value: RENEWED_PROGRAM, label: "Renewed" },
  { value: NOT_RENEWED_PROGRAM, label: "Not Renewed" },
];
const PROGRAM_STATUSES = Object.values(ProgramStatus) as string[];
const selectedStatuses = ref([ALL_STATUS]);

/**
 * Program year currently selected, kept locally as the full object to be
 * provided in the emitted events. The programYearId model is not used for it
 * since, when bound by the parent, its value is only updated once the parent
 * re-renders.
 */
const selectedProgramYear = ref<EducationProgramYearAPIOutDTO>();

/**
 * Finds the program year among the ones available to be selected.
 * @param id program year id.
 * @returns program year found, if any.
 */
const findProgramYear = (
  id: number | null | undefined,
): EducationProgramYearAPIOutDTO | undefined =>
  educationProgramYears.value.find((programYear) => programYear.id === id);

/**
 * Notifies that the filters were changed by the user.
 */
const emitFiltersChanged = () => {
  emit("filtersChanged", selectedProgramYear.value);
};

/**
 * Handles the program year selection changed by the user.
 * @param id program year id selected.
 */
const programYearChanged = (id: number | null) => {
  selectedProgramYear.value = findProgramYear(id);
  programYearId.value = id;
  emitFiltersChanged();
};

/**
 * Converts the status toggle selection into the status filters.
 * @param statuses statuses selected in the toggle group.
 * @returns status filters reflecting the selection.
 */
const getStatusFilters = (statuses: string[]): ProgramStatusFilters => {
  // Only actual program statuses are sent as the status search.
  const statusSearch = statuses.filter((status) =>
    PROGRAM_STATUSES.includes(status),
  ) as ProgramStatus[];
  return {
    inactiveProgramSearch: statuses.includes(INACTIVE_PROGRAM),
    renewedProgramSearch: statuses.includes(RENEWED_PROGRAM),
    notRenewedProgramSearch: statuses.includes(NOT_RENEWED_PROGRAM),
    ...(statusSearch.length ? { statusSearch } : {}),
  };
};

/**
 * Handles status filter changes from the toggle group, enforcing mutual
 * exclusivity between "All" and specific statuses.
 * @param newVal The new array of selected status values emitted by the toggle.
 */
const handleStatusChange = (newVal: string[]) => {
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
  statusFilters.value = getStatusFilters(selectedStatuses.value);
  emitFiltersChanged();
};

// Validates the initial program year selection once the program years are
// loaded, immediately when they are already cached. Once loaded, the cache is
// never cleared, hence this runs only once, and later refreshes, successful
// or not, do not re-initialize the selection.
watch(
  educationProgramYearsLoaded,
  (loaded) => {
    if (!loaded) {
      // Keeps the provided program year until the first load.
      return;
    }
    // No program year is selected by default, unless a valid one was provided,
    // otherwise the user must select one to list the programs.
    selectedProgramYear.value = findProgramYear(programYearId.value);
    if (!selectedProgramYear.value) {
      programYearId.value = undefined;
    }
    emit("initialized", selectedProgramYear.value);
  },
  { immediate: true },
);

// Keeps the selection in sync when the program year is changed by the parent,
// for instance, when the route changes while the page is reused. Before the
// program years are loaded, the initial validation handles the selection.
watch(programYearId, (id) => {
  if (
    !educationProgramYearsLoaded.value ||
    (id ?? undefined) === selectedProgramYear.value?.id
  ) {
    return;
  }
  selectedProgramYear.value = findProgramYear(id);
  if (!selectedProgramYear.value) {
    programYearId.value = undefined;
  }
  emitFiltersChanged();
});
</script>
