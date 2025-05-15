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
          @keyup.enter="searchChangeRequests"
          prepend-inner-icon="mdi-magnify"
          hide-details="auto"
        >
        </v-text-field>
      </template>
    </body-header>
    <content-group>
      <toggle-content :toggled="!changeRequests.results?.length">
        <v-data-table-server
          :headers="tableHeaders"
          :items="changeRequests.results"
          :items-length="changeRequests.count"
          :loading="loading"
          :page="page"
          :items-per-page="pageLimit"
          :items-per-page-options="PAGINATION_LIST"
          @update:options="handleOptionsUpdate"
          class="elevation-1"
        >
          <template #[`item.submittedDate`]="{ item }">
            <span>
              {{ dateOnlyLongString(item.submittedDate) }}
            </span>
          </template>
          <template #[`item.firstName`]="{ item }">
            <span>
              {{ emptyStringFiller(item.firstName) }}
            </span>
          </template>
          <template #[`item.action`]="{ item }">
            <v-btn
              color="primary"
              @click="goToStudentAssessment(item.applicationId, item.studentId)"
              >View</v-btn
            >
          </template>
        </v-data-table-server>
      </toggle-content>
    </content-group>
  </full-page-container>
</template>

<script lang="ts">
// NOSONAR
import { ref, onMounted, defineComponent } from "vue";
import { useRouter } from "vue-router";
import {
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  DataTableSortOrder,
  DEFAULT_PAGE_NUMBER,
  PaginatedResults,
  DataTableOptions,
  DataTableSortByOrder,
} from "@/types";
import { useFormatters } from "@/composables";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { ApplicationChangeRequestPendingSummaryAPIOutDTO } from "@/services/http/dto/ApplicationChangeRequest.dto";
import { ChangeRequestService } from "@/services/ChangeRequestService";
import { PendingApplicationEditsTableHeaders } from "@/types/contracts/DataTableContract";

const DEFAULT_SORT_FIELD = "submittedDate";

export default defineComponent({
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const currentPage = ref(DEFAULT_PAGE_NUMBER + 1);
    const currentPageLimit = ref(DEFAULT_PAGE_LIMIT);
    const currentSortField = ref(DEFAULT_SORT_FIELD);
    const currentSortOrder = ref(DataTableSortOrder.ASC);
    const searchCriteria = ref<string | undefined>();
    const { dateOnlyLongString, emptyStringFiller } = useFormatters();
    const changeRequests = ref<
      PaginatedResults<ApplicationChangeRequestPendingSummaryAPIOutDTO>
    >({} as PaginatedResults<ApplicationChangeRequestPendingSummaryAPIOutDTO>);

    const goToStudentAssessment = (
      applicationId: number,
      studentId: number,
    ) => {
      router.push({
        name: AESTRoutesConst.ASSESSMENTS_SUMMARY,
        params: {
          applicationId: applicationId,
          studentId: studentId,
        },
      });
    };

    const loadChangeRequests = async (
      page: number,
      pageLimit: number,
      sortField: string,
      sortOrder: DataTableSortOrder,
    ) => {
      loading.value = true;
      try {
        const result = await ChangeRequestService.shared.getChangeRequests({
          page,
          pageLimit,
          sortField,
          sortOrder,
          searchCriteria: searchCriteria.value,
        });
        changeRequests.value = result;
      } catch (error) {
        console.error("Error fetching change requests:", error);
        changeRequests.value = {
          results: [],
          count: 0,
        } as PaginatedResults<ApplicationChangeRequestPendingSummaryAPIOutDTO>;
      } finally {
        loading.value = false;
      }
    };

    const handleOptionsUpdate = async (options: DataTableOptions) => {
      currentPage.value = options.page;
      currentPageLimit.value = options.itemsPerPage;

      let newSortFieldAPI = DEFAULT_SORT_FIELD;
      let newSortOrderAPI = DataTableSortOrder.ASC;

      if (options.sortBy && options.sortBy.length > 0) {
        newSortFieldAPI = options.sortBy[0].key;
        newSortOrderAPI =
          options.sortBy[0].order === DataTableSortByOrder.DESC
            ? DataTableSortOrder.DESC
            : DataTableSortOrder.ASC;
      }
      currentSortField.value = newSortFieldAPI;
      currentSortOrder.value = newSortOrderAPI;
      await loadChangeRequests(
        options.page - 1,
        options.itemsPerPage,
        newSortFieldAPI,
        newSortOrderAPI,
      );
    };

    const searchChangeRequests = async () => {
      currentPage.value = DEFAULT_PAGE_NUMBER + 1;
      await loadChangeRequests(
        DEFAULT_PAGE_NUMBER,
        currentPageLimit.value,
        currentSortField.value,
        currentSortOrder.value,
      );
    };

    onMounted(async () => {
      await loadChangeRequests(
        currentPage.value - 1,
        currentPageLimit.value,
        currentSortField.value,
        currentSortOrder.value,
      );
    });

    return {
      loading,
      page: currentPage,
      pageLimit: currentPageLimit,
      searchCriteria,
      changeRequests,
      tableHeaders: PendingApplicationEditsTableHeaders,
      dateOnlyLongString,
      emptyStringFiller,
      goToStudentAssessment,
      handleOptionsUpdate,
      searchChangeRequests,
      PAGINATION_LIST,
    };
  },
});
</script>
