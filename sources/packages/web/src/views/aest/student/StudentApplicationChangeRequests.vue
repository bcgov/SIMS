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
          :page="page + 1"
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
    const page = ref(DEFAULT_PAGE_NUMBER); // API uses 0-indexed pages
    const pageLimit = ref(DEFAULT_PAGE_LIMIT);
    const sortField = ref(DEFAULT_SORT_FIELD);
    const sortOrder = ref(DataTableSortOrder.ASC);
    const searchCriteria = ref<string | undefined>();
    const { dateOnlyLongString, emptyStringFiller } = useFormatters();
    const changeRequests = ref<
      PaginatedResults<ApplicationChangeRequestPendingSummaryAPIOutDTO>
    >({
      results: [],
      count: 0,
    } as PaginatedResults<ApplicationChangeRequestPendingSummaryAPIOutDTO>);

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

    const fetchChangeRequests = async () => {
      loading.value = true;
      try {
        const result = await ChangeRequestService.shared.getChangeRequests({
          page: page.value, // Send 0-indexed page to API
          pageLimit: pageLimit.value,
          sortField: sortField.value,
          sortOrder: sortOrder.value,
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

    const handleOptionsUpdate = (options: {
      page: number;
      itemsPerPage: number;
      sortBy: Readonly<{ key: string; order: "asc" | "desc" }[]>;
    }) => {
      page.value = options.page - 1;
      pageLimit.value = options.itemsPerPage;
      if (options.sortBy && options.sortBy.length > 0) {
        sortField.value = options.sortBy[0].key;
        const order = options.sortBy[0].order;
        if (order === "asc") {
          sortOrder.value = DataTableSortOrder.ASC;
        } else if (order === "desc") {
          sortOrder.value = DataTableSortOrder.DESC;
        } else {
          sortOrder.value = DataTableSortOrder.ASC;
        }
      } else {
        sortField.value = DEFAULT_SORT_FIELD;
        sortOrder.value = DataTableSortOrder.ASC;
      }
      fetchChangeRequests();
    };

    const searchChangeRequests = async () => {
      page.value = DEFAULT_PAGE_NUMBER;
      await fetchChangeRequests();
    };

    onMounted(async () => {
      await fetchChangeRequests();
    });

    return {
      loading,
      page,
      pageLimit,
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
