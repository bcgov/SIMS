<template>
  <body-header
    title="Pending forms"
    :records-count="pendingForms.count"
    sub-title="Forms that require ministry review."
  />
  <content-group>
    <v-row class="m-0 p-0 mb-2" align="center">
      <v-col md="auto" class="flex-grow-1 pa-0 pr-2 mb-1">
        <v-text-field
          density="compact"
          label="Search name"
          variant="outlined"
          v-model="searchCriteria"
          @keyup.enter="searchForms"
          prepend-inner-icon="mdi-magnify"
          hide-details="auto"
        />
      </v-col>
      <v-col cols="auto" class="pa-0 pr-2">
        <v-btn color="primary" :loading="isLoading" @click="searchForms"
          >Search</v-btn
        >
      </v-col>
    </v-row>
    <toggle-content :toggled="!pendingForms.count && !isLoading">
      <v-data-table-server
        :headers="PendingFormsTableHeaders"
        :items="pendingForms.results"
        :items-length="pendingForms.count"
        :loading="isLoading"
        :items-per-page="DEFAULT_PAGE_LIMIT"
        :items-per-page-options="ITEMS_PER_PAGE"
        @update:options="pageSortEvent"
      >
        <template #loading>
          <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
        </template>
        <template #[`item.submittedDate`]="{ item }">
          {{ dateOnlyLongString(item.submittedDate) }}
        </template>
        <template #[`item.firstName`]="{ item }">
          {{ emptyStringFiller(item.firstName) }}
        </template>
        <template #[`item.formNames`]="{ item }">
          <div v-for="formName in item.formNames" :key="formName">
            {{ formName }}
          </div>
        </template>
        <template #[`item.action`]="{ item }">
          <v-btn color="primary" @click="goToFormSubmission(item)">View</v-btn>
        </template>
      </v-data-table-server>
    </toggle-content>
  </content-group>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  DataTableSortByOrder,
  PendingFormsTableHeaders,
  DataTableOptions,
  PaginationOptions,
  DEFAULT_DATATABLE_PAGE_NUMBER,
  FormCategory,
} from "@/types";
import { useFormatters, useSnackBar } from "@/composables";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import {
  FormSubmissionPendingSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import { FormSubmissionService } from "@/services/FormSubmissionService";

const router = useRouter();
const { dateOnlyLongString, emptyStringFiller } = useFormatters();
const snackBar = useSnackBar();
const isLoading = ref(false);
const searchCriteria = ref("");
const pendingForms = ref<
  PaginatedResultsAPIOutDTO<FormSubmissionPendingSummaryAPIOutDTO>
>({ results: [], count: 0 });

const DEFAULT_SORT_FIELD = "submittedDate";
const currentPagination: PaginationOptions = {
  page: DEFAULT_DATATABLE_PAGE_NUMBER,
  pageLimit: DEFAULT_PAGE_LIMIT,
  sortField: DEFAULT_SORT_FIELD,
  sortOrder: DataTableSortByOrder.DESC,
};

/**
 * Navigates to the form submission approval page for ministry review.
 * @param formSubmission pending form submission to navigate to.
 */
const goToFormSubmission = (
  formSubmission: FormSubmissionPendingSummaryAPIOutDTO,
) => {
  router.push({
    name: AESTRoutesConst.STUDENT_FORM_SUBMISSION_APPROVAL,
    params: { formSubmissionId: formSubmission.formSubmissionId },
  });
};

const loadForms = async () => {
  try {
    isLoading.value = true;
    pendingForms.value =
      await FormSubmissionService.shared.getPendingFormSubmissions(
        {
          page: currentPagination.page,
          pageLimit: currentPagination.pageLimit,
          sortField: currentPagination.sortField,
          sortOrder: currentPagination.sortOrder,
          searchCriteria: searchCriteria.value,
        },
        { formCategory: FormCategory.StudentForm },
      );
  } catch {
    snackBar.error("Error loading pending forms.");
  } finally {
    isLoading.value = false;
  }
};

const searchForms = async () => {
  await loadForms();
};

const pageSortEvent = async (event: DataTableOptions) => {
  currentPagination.page = event.page;
  currentPagination.pageLimit = event.itemsPerPage;
  if (event.sortBy.length) {
    const [sortBy] = event.sortBy;
    currentPagination.sortField = sortBy.key;
    currentPagination.sortOrder = sortBy.order;
  } else {
    currentPagination.sortField = DEFAULT_SORT_FIELD;
    currentPagination.sortOrder = DataTableSortByOrder.DESC;
  }
  await loadForms();
};

onMounted(async () => {
  await loadForms();
});
</script>
