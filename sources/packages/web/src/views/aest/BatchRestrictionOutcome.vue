<template>
  <full-page-container
    :full-width="true"
    :layout-template="LayoutTemplates.Centered"
  >
    <template #header>
      <header-navigator
        title="Batch Restrictions"
        :route-location="{ name: AESTRoutesConst.BATCH_RESTRICTION }"
        sub-title="Batch Restriction Outcome"
      />
      <detail-header :header-map="batchHeaderMap" />
    </template>
    <body-header-container :enable-card-view="true">
      <template #header>
        <body-header title="Batch restriction outcome" />
      </template>
      <search-table
        v-model="searchCriteria"
        search-label="Search application number"
        :loading="loading"
        @search="loadStudents"
      >
        <template #append-search>
          <v-btn-toggle
            v-model="selectedFilter"
            mandatory
            color="primary"
            density="compact"
            class="btn-toggle"
            selected-class="selected-btn-toggle"
            @update:model-value="loadStudents"
          >
            <v-btn
              v-for="filter in ResultFilter"
              :key="filter"
              :value="filter"
              rounded="xl"
              color="primary"
              class="mr-2"
              >{{ filter }}</v-btn
            >
          </v-btn-toggle>
        </template>
        <toggle-content
          :toggled="!paginatedStudents.count && !loading"
          message="No students found."
        >
          <v-data-table-server
            :headers="BatchRestrictionStudentHeaders"
            :items="paginatedStudents.results"
            :items-length="paginatedStudents.count"
            :loading="loading"
            :items-per-page="DEFAULT_PAGE_LIMIT"
            :items-per-page-options="ITEMS_PER_PAGE"
            @update:options="pageEvent"
            :mobile="isMobile"
          >
            <template #loading>
              <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
            </template>
            <template #[`item.applicationNumber`]="{ item }">
              {{ item.applicationNumber }}
            </template>
            <template #[`item.result`]="{ item }">
              <status-chip-batch-restriction-student-result
                :status="item.result"
              />
            </template>
            <template #[`item.failureReason`]="{ item }">
              {{ emptyStringFiller(item.failureReason) }}
            </template>
            <template #[`item.action`]="{ item }">
              <v-btn
                v-if="item.studentId"
                color="primary"
                variant="outlined"
                :to="{
                  name: AESTRoutesConst.STUDENT_RESTRICTION,
                  params: { studentId: item.studentId },
                }"
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
import { computed, ref, watchEffect } from "vue";
import { useDisplay } from "vuetify";
import {
  BatchRestrictionStudentHeaders,
  BatchRestrictionStudentResult,
  DataTableOptions,
  DEFAULT_DATATABLE_PAGE_NUMBER,
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  LayoutTemplates,
  PaginationOptions,
} from "@/types";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import {
  BatchRestrictionDetailsAPIOutDTO,
  BatchRestrictionStudentAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import { BatchRestrictionService } from "@/services/BatchRestrictionService";
import { useFormatters, useSnackBar } from "@/composables";
import StatusChipBatchRestrictionStudentResult from "@/components/generic/StatusChipBatchRestrictionStudentResult.vue";
import DetailHeader from "@/components/generic/DetailHeader.vue";

const ResultFilter = {
  All: "All",
  ...BatchRestrictionStudentResult,
} as const;

interface Props {
  batchRestrictionId: number;
}

const props = defineProps<Props>();
const { mobile: isMobile } = useDisplay();
const snackBar = useSnackBar();
const { emptyStringFiller } = useFormatters();
// Starts as loading to render the data table, which triggers the initial load on mount.
const loading = ref(true);
const searchCriteria = ref("");
const selectedFilter = ref<BatchRestrictionStudentResult | "All">(
  ResultFilter.All,
);
const batchRestriction = ref<BatchRestrictionDetailsAPIOutDTO>();
const paginatedStudents = ref<
  PaginatedResultsAPIOutDTO<BatchRestrictionStudentAPIOutDTO>
>({ results: [], count: 0 });

const batchHeaderMap = computed<Record<string, string | undefined>>(() => ({
  "Batch ID": batchRestriction.value?.batchNumber.toString(),
  Restriction: batchRestriction.value
    ? `${batchRestriction.value.restrictionCode} - ${batchRestriction.value.restrictionDescription}`
    : undefined,
}));

const currentPagination: PaginationOptions = {
  page: DEFAULT_DATATABLE_PAGE_NUMBER,
  pageLimit: DEFAULT_PAGE_LIMIT,
};

const loadBatchRestriction = async () => {
  try {
    batchRestriction.value =
      await BatchRestrictionService.shared.getBatchRestriction(
        props.batchRestrictionId,
      );
  } catch {
    snackBar.error(
      "Unexpected error while loading the batch restriction details.",
    );
  }
};

const loadStudents = async () => {
  try {
    loading.value = true;
    const criteria: Record<string, string> = {
      searchCriteria: searchCriteria.value,
    };
    if (selectedFilter.value !== ResultFilter.All) {
      criteria.result = selectedFilter.value;
    }
    paginatedStudents.value =
      await BatchRestrictionService.shared.getBatchRestrictionStudents(
        props.batchRestrictionId,
        { ...currentPagination, searchCriteria: criteria },
      );
  } catch {
    snackBar.error(
      "Unexpected error while loading the batch restriction results.",
    );
  } finally {
    loading.value = false;
  }
};

/**
 * Page event handler.
 * @param event The data table page event.
 */
const pageEvent = async (event: DataTableOptions) => {
  currentPagination.page = event.page;
  currentPagination.pageLimit = event.itemsPerPage;
  await loadStudents();
};

watchEffect(loadBatchRestriction);
</script>
