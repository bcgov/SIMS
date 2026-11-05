<template>
  <div class="d-flex flex-wrap ga-2">
    <!--
      When the status filters are inline, the program year keeps a fixed width.
      Otherwise, the filters are in a second row and the program year takes the
      full width of the first row.
    -->
    <v-select
      class="flex-shrink-0"
      :class="showInlineFilters ? 'flex-grow-0' : 'flex-grow-1'"
      width="180
      "
      label="Program year"
      placeholder="Select year"
      persistent-placeholder
      density="compact"
      :items="programYears"
      item-title="description"
      item-value="id"
      v-model="programYearId"
      @update:model-value="emitFiltersChanged"
      variant="outlined"
      hide-details="auto"
      prepend-inner-icon="mdi-calendar-range"
      :loading="loading || loadingProgramYears"
      autofocus
    />
    <v-divider v-if="showInlineFilters" vertical />
    <!--
      On large screens the status filters are shown inline, next to the program
      year. On smaller screens they move to a second row, taking the full width,
      to avoid compressing the buttons.
      The toggle group height is not fixed (h-auto) and the buttons have an
      explicit height, so when the buttons wrap into multiple lines they keep
      their height instead of sharing the group height.
    -->
    <v-btn-toggle
      :model-value="selectedStatuses"
      @update:model-value="handleStatusChange"
      multiple
      density="compact"
      class="flex-wrap h-auto ga-2 align-self-center btn-toggle"
      :class="showInlineFilters ? 'flex-grow-1' : 'w-100'"
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
import { ref, computed, onMounted } from "vue";
import { useDisplay } from "vuetify";
import { EducationProgramService } from "@/services/EducationProgramService";
import { ProgramStatus, type ProgramStatusFilters } from "@/types";
import { INACTIVE_PROGRAM } from "@/constants";
import type { EducationProgramYearAPIOutDTO } from "@/services/http/dto";
import { useSnackBar } from "@/composables";

interface ProgramYearStatusFiltersProps {
  // Indicates the programs are being loaded.
  loading?: boolean;
}

withDefaults(defineProps<ProgramYearStatusFiltersProps>(), {
  loading: false,
});

const emit = defineEmits<{
  // Program years loaded and the initial selection validated.
  // Provides the initially selected program year, if any.
  initialized: [programYear?: EducationProgramYearAPIOutDTO];
  // Program year or status filters changed by the user.
  // Provides the currently selected program year, if any.
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

const snackBar = useSnackBar();
const { width } = useDisplay();
// Minimum screen width, in pixels, to show the status filters inline.
// Below it, the filters move to a second row. A custom value is
// used since the Vuetify lg breakpoint (1280px) is too narrow to fit all
// the buttons and the xl one (1920px) is too wide.
const INLINE_FILTERS_MIN_WIDTH = 1200;
const showInlineFilters = computed(
  () => width.value >= INLINE_FILTERS_MIN_WIDTH,
);
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
const loadingProgramYears = ref(false);
// Program years with education program configurations available to be selected.
const programYears = ref<EducationProgramYearAPIOutDTO[]>([]);

/**
 * Gets the program year currently selected.
 * @returns selected program year, if any.
 */
const getSelectedProgramYear = (): EducationProgramYearAPIOutDTO | undefined =>
  programYears.value.find(
    (programYear) => programYear.id === programYearId.value,
  );

/**
 * Notifies that the filters were changed by the user.
 */
const emitFiltersChanged = () => {
  emit("filtersChanged", getSelectedProgramYear());
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

onMounted(async () => {
  loadingProgramYears.value = true;
  try {
    programYears.value =
      await EducationProgramService.shared.getProgramYearsList();
  } catch {
    snackBar.error("Unexpected error while loading program years.");
  } finally {
    loadingProgramYears.value = false;
  }
  // No program year is selected by default, unless a valid one was provided,
  // otherwise the user must select one to list the programs.
  const selectedProgramYear = getSelectedProgramYear();
  if (!selectedProgramYear) {
    programYearId.value = undefined;
  }
  emit("initialized", selectedProgramYear);
});
</script>
