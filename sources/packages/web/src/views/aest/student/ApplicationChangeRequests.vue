<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator
        title="Student requests"
        subTitle="Change request (2025-2026 and later)"
      />
    </template>
    <body-header
      title="Pending change requests"
      :recordsCount="changeRequests.count"
      subTitle="Change requests that require ministry review."
    >
      <template #actions>
        <v-text-field
          density="compact"
          label="Search name or application #"
          variant="outlined"
          v-model="searchCriteria"
          @keyup.enter="resetPageAndLoadApplications"
          prepend-inner-icon="mdi-magnify"
          hide-details="auto"
        />
      </template>
    </body-header>
    <content-group>
      <toggle-content :toggled="!changeRequests.count && !isLoading">
        <v-data-table-server
          :headers="PendingChangeRequestsTableHeaders"
          :items="changeRequests.results"
          :items-length="changeRequests.count"
          :loading="isLoading"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="PAGINATION_LIST"
          @update:options="paginationAndSortEvent"
        >
          <template v-slot:loading>
            <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
          </template>
          <template #[`item.submittedDate`]="{ item }">
            {{ dateOnlyLongString(item.submittedDate) }}
          </template>
          <template #[`item.firstName`]="{ item }">
            {{ emptyStringFiller(item.firstName) }}
          </template>
          <template #[`item.action`]="{ item }">
            <v-btn
              color="primary"
              @click="
                navigateToStudentAssessment(
                  item.applicationId,
                  item.studentId,
                  item.precedingApplicationId,
                )
              "
            >
              View
            </v-btn>
          </template>
        </v-data-table-server>
      </toggle-content>
    </content-group>
  </full-page-container>
</template>

<script lang="ts">
import { ref, onMounted, defineComponent } from "vue";
import { useRouter } from "vue-router";
import {
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  DEFAULT_DATATABLE_PAGE_NUMBER,
  DataTableOptions,
  DataTableSortByOrder,
} from "@/types";
import { useFormatters, useSnackBar } from "@/composables";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { ApplicationChangeRequestService } from "@/services/ApplicationChangeRequestService";
import { ApplicationChangeRequestPendingSummaryAPIOutDTO } from "@/services/http/dto/ApplicationChangeRequest.dto";
import { PendingChangeRequestsTableHeaders } from "@/types/contracts/DataTableContract";
import { PaginatedResultsAPIOutDTO } from "@/services/http/dto";

export default defineComponent({
  setup() {
    const router = useRouter();
    const snackBar = useSnackBar();
    const { dateOnlyLongString, emptyStringFiller } = useFormatters();
    const isLoading = ref(false);
    const searchCriteria = ref<string | undefined>();
    const changeRequests = ref(
      {} as PaginatedResultsAPIOutDTO<ApplicationChangeRequestPendingSummaryAPIOutDTO>,
    );
    const loadChangeRequests = async (
      page = DEFAULT_DATATABLE_PAGE_NUMBER,
      pageLimit = DEFAULT_PAGE_LIMIT,
      sortField?: string,
      sortOrder?: DataTableSortByOrder,
    ) => {
      isLoading.value = true;

      try {
        const result =
          await ApplicationChangeRequestService.shared.getApplicationChangeRequests(
            {
              page,
              pageLimit,
              sortField,
              sortOrder,
              searchCriteria: searchCriteria.value,
            },
          );
        changeRequests.value = result;
      } catch {
        snackBar.error("Failed to load change requests");
        changeRequests.value = {
          results: [],
          count: 0,
        };
      } finally {
        isLoading.value = false;
      }
    };

    const paginationAndSortEvent = async (event: DataTableOptions) => {
      const [sortByOptions] = event.sortBy ?? [];
      await loadChangeRequests(
        event.page,
        event.itemsPerPage,
        sortByOptions?.key,
        sortByOptions?.order,
      );
    };

    const resetPageAndLoadApplications = async () => {
      await loadChangeRequests();
    };

    const navigateToStudentAssessment = (
      applicationId: number,
      studentId: number,
      precedingApplicationId: number,
    ) => {
      router.push({
        name: AESTRoutesConst.APPLICATION_VERSION_DETAILS,
        params: {
          studentId,
          applicationId: precedingApplicationId,
          versionApplicationId: applicationId,
        },
      });
    };

    onMounted(async () => {
      await loadChangeRequests();
    });

    return {
      isLoading,
      PendingChangeRequestsTableHeaders,
      searchCriteria,
      changeRequests,
      paginationAndSortEvent,
      resetPageAndLoadApplications,
      navigateToStudentAssessment,
      dateOnlyLongString,
      emptyStringFiller,
      PAGINATION_LIST,
      DEFAULT_PAGE_LIMIT,
    };
  },
});
</script>
