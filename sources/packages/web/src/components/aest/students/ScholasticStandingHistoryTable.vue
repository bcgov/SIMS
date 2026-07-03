<template>
  <body-header-container :enable-card-view="true">
    <template #header>
      <body-header title="Scholastic History">
        <template #actions>
          <v-btn-toggle
            v-model="selectedFilter"
            color="primary"
            density="compact"
            class="float-right btn-toggle"
            selected-class="selected-btn-toggle"
            @update:model-value="onFilterChange"
          >
            <v-btn value="all" rounded="xl" color="primary" class="mr-2"
              >All</v-btn
            >
            <v-btn value="active" rounded="xl" color="primary" class="mr-2"
              >Active</v-btn
            >
            <v-btn value="inactive" rounded="xl" color="primary"
              >Inactive</v-btn
            >
          </v-btn-toggle>
        </template>
      </body-header>
    </template>
    <content-group>
      <toggle-content
        :toggled="!filteredScholasticStandings.length && !isLoading"
      >
        <v-data-table
          :headers="ScholasticStandingHistoryHeaders"
          :items="filteredScholasticStandings"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          :mobile="isMobile"
          :loading="isLoading"
        >
          <template #loading>
            <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
          </template>
          <template #[`item.submittedDate`]="{ item }">
            {{ dateOnlyLongString(item.submittedDate) }}
          </template>
          <template #[`item.dateOfWithdrawal`]="{ item }">
            {{ emptyStringFiller(dateOnlyLongString(item.dateOfWithdrawal)) }}
          </template>
          <template #[`item.scholasticStandingChangeType`]="{ item }">
            {{ getChangeTypeLabel(item.scholasticStandingChangeType!) }}
          </template>
          <template #[`item.tags`]="{ item }">
            <chip-tag v-if="item.reversalDate" color="error" label="Reversed" />
            <chip-tag
              v-if="item.nonPunitiveFormSubmissionId"
              class="non-punitive-tag"
              label="Non-punitive"
            />
          </template>
          <template #[`item.action`]="{ item }">
            <v-btn color="primary" @click="goToScholasticStanding(item)"
              >View</v-btn
            >
          </template>
        </v-data-table>
      </toggle-content>
    </content-group>
  </body-header-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import { useFormatters, useSnackBar } from "@/composables";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { ScholasticStandingService } from "@/services/ScholasticStandingService";
import { ScholasticStandingDetailsAPIOutDTO } from "@/services/http/dto";
import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  ScholasticStandingHistoryHeaders,
  StudentScholasticStandingChangeType,
} from "@/types";

interface Props {
  studentId: number;
}

type FilterType = "all" | "active" | "inactive";

const props = defineProps<Props>();
const { mobile: isMobile } = useDisplay();
const router = useRouter();
const snackBar = useSnackBar();
const { dateOnlyLongString, emptyStringFiller } = useFormatters();

const isLoading = ref(false);
const selectedFilter = ref<FilterType>("all");
const scholasticStandings = ref<ScholasticStandingDetailsAPIOutDTO[]>([]);

const filteredScholasticStandings = computed(() => {
  switch (selectedFilter.value) {
    case "active":
      return scholasticStandings.value.filter(
        (standing) => !standing.reversalDate,
      );
    case "inactive":
      return scholasticStandings.value.filter(
        (standing) => !!standing.reversalDate,
      );
    default:
      return scholasticStandings.value;
  }
});

/**
 * Handles the filter toggle change. When all buttons are deselected (i.e., the
 * user clicks the currently active button), resets the selection back to "all"
 * to ensure at least one filter is always active.
 * @param value the new filter value from the toggle.
 */
const onFilterChange = (value: FilterType | undefined) => {
  if (value === undefined) {
    selectedFilter.value = "all";
  }
};

const loadScholasticStandings = async () => {
  try {
    isLoading.value = true;
    scholasticStandings.value =
      await ScholasticStandingService.shared.getScholasticStandings(
        props.studentId,
      );
  } catch {
    snackBar.error("Error loading Scholastic History.");
  } finally {
    isLoading.value = false;
  }
};

const CHANGE_TYPE_LABELS: Record<StudentScholasticStandingChangeType, string> =
  {
    [StudentScholasticStandingChangeType.StudentWithdrewFromProgram]:
      "Withdrawal",
    [StudentScholasticStandingChangeType.StudentDidNotCompleteProgram]:
      "Unsuccessful",
    [StudentScholasticStandingChangeType.StudentCompletedProgramEarly]:
      "Early completion",
    [StudentScholasticStandingChangeType.SchoolTransfer]: "Transfer",
  };

const getChangeTypeLabel = (
  scholasticStandingChangeType: StudentScholasticStandingChangeType,
): string => {
  return CHANGE_TYPE_LABELS[scholasticStandingChangeType];
};

/**
 * Navigate to scholastic standing details for the selected row.
 * @param scholasticStanding Scholastic standing row selected in the table.
 */
const goToScholasticStanding = (
  scholasticStanding: ScholasticStandingDetailsAPIOutDTO,
) => {
  router.push({
    name: AESTRoutesConst.SCHOLASTIC_STANDING_VIEW_FROM_RESTRICTIONS,
    params: {
      studentId: props.studentId,
      applicationId: scholasticStanding.applicationId,
      scholasticStandingId: scholasticStanding.scholasticStandingId,
    },
  });
};

onMounted(async () => {
  await loadScholasticStandings();
});
</script>
