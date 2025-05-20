<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator title="Student requests" subTitle="Change requests" />
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
      <toggle-content :toggled="!changeRequests.count">
        <v-data-table-server
          :headers="PendingApplicationEditsTableHeaders"
          :items="changeRequests.results"
          :items-length="changeRequests.count"
          :loading="isLoading"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="PAGINATION_LIST"
          @update:options="paginationAndSortEvent"
        >
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
  DataTableSortOrder,
  DEFAULT_DATATABLE_PAGE_NUMBER,
  DataTableOptions,
  DataTableSortByOrder,
} from "@/types";
import { useFormatters } from "@/composables";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { ApplicationChangeRequestService } from "@/services/ApplicationChangeRequestService";
import { ApplicationChangeRequestPendingSummaryAPIOutDTO } from "@/services/http/dto/ApplicationChangeRequest.dto";
import { PendingApplicationEditsTableHeaders } from "@/types/contracts/DataTableContract";
import { PaginatedResultsAPIOutDTO } from "@/services/http/dto";

export default defineComponent({
  setup() {
    const router = useRouter();
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
      sortOrder?: DataTableSortOrder,
    ) => {
      isLoading.value = true;

      try {
        const result =
          await ApplicationChangeRequestService.shared.getChangeRequests({
            page,
            pageLimit,
            sortField,
            sortOrder,
            searchCriteria: searchCriteria.value,
          });
        changeRequests.value = result;
      } catch (error: unknown) {
        console.error("Error fetching change requests:", error);
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
      let sortOrder: DataTableSortOrder | undefined = undefined;
      if (sortByOptions?.order === DataTableSortByOrder.DESC) {
        sortOrder = DataTableSortOrder.DESC;
      } else if (sortByOptions?.order === DataTableSortByOrder.ASC) {
        sortOrder = DataTableSortOrder.ASC;
      }
      await loadChangeRequests(
        event.page,
        event.itemsPerPage,
        sortByOptions?.key,
        sortOrder,
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
          applicationId,
          versionApplicationId: precedingApplicationId,
        },
      });
    };

    onMounted(async () => {
      await loadChangeRequests();
    });

    return {
      isLoading,
      PendingApplicationEditsTableHeaders,
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
