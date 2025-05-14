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
        <DataTable
          :value="changeRequests.results"
          :lazy="true"
          class="p-m-4"
          :paginator="true"
          :rows="pageLimit"
          :rowsPerPageOptions="PAGINATION_LIST"
          :totalRecords="changeRequests.count"
          @page="pageEvent"
          @sort="sortEvent"
        >
          <Column
            field="submittedDate"
            :sortable="true"
            header="Date submitted"
          >
            <template #body="slotProps">
              <span>
                {{ dateOnlyLongString(slotProps.data.submittedDate) }}
              </span>
            </template>
          </Column>
          <Column field="firstName" header="Given names">
            <template #body="slotProps">
              <span>
                {{ emptyStringFiller(slotProps.data.firstName) }}
              </span>
            </template>
          </Column>
          <Column field="lastName" header="Last name" :sortable="true">
          </Column>
          <Column
            field="applicationNumber"
            :sortable="true"
            header="Application #"
          ></Column>
          <Column header="Action">
            <template #body="slotProps">
              <v-btn
                color="primary"
                @click="
                  goToStudentAssessment(
                    slotProps.data.applicationId,
                    slotProps.data.studentId,
                  )
                "
                >View</v-btn
              >
            </template>
          </Column>
        </DataTable>
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
  PageAndSortEvent,
  PaginatedResults,
} from "@/types";
import { useFormatters } from "@/composables";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { StudentAppealPendingSummaryAPIOutDTO } from "@/services/http/dto/StudentAppeal.dto";
import { ChangeRequestService } from "@/services/ChangeRequestService";

const DEFAULT_SORT_FIELD = "submittedDate";

export default defineComponent({
  setup() {
    const router = useRouter();
    const page = ref(DEFAULT_PAGE_NUMBER);
    const pageLimit = ref(DEFAULT_PAGE_LIMIT);
    const sortField = ref(DEFAULT_SORT_FIELD);
    const sortOrder = ref(DataTableSortOrder.ASC);
    const searchCriteria = ref();
    const { dateOnlyLongString, emptyStringFiller } = useFormatters();
    const changeRequests = ref(
      {} as PaginatedResults<StudentAppealPendingSummaryAPIOutDTO>,
    );

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
      changeRequests.value =
        await ChangeRequestService.shared.getChangeRequests({
          page: page.value,
          pageLimit: pageLimit.value,
          sortField: sortField.value,
          sortOrder: sortOrder.value,
          searchCriteria: searchCriteria.value,
        });
    };

    const pageEvent = async (event: PageAndSortEvent) => {
      page.value = event?.page;
      pageLimit.value = event?.rows;
      await fetchChangeRequests();
    };

    const sortEvent = async (event: PageAndSortEvent) => {
      page.value = DEFAULT_PAGE_NUMBER;
      pageLimit.value = DEFAULT_PAGE_LIMIT;
      sortField.value = event.sortField;
      sortOrder.value = event.sortOrder;
      await fetchChangeRequests();
    };

    const searchChangeRequests = async () => {
      page.value = DEFAULT_PAGE_NUMBER;
      pageLimit.value = DEFAULT_PAGE_LIMIT;
      await fetchChangeRequests();
    };

    onMounted(async () => {
      await fetchChangeRequests();
    });

    return {
      goToStudentAssessment,
      changeRequests,
      dateOnlyLongString,
      pageEvent,
      sortEvent,
      searchChangeRequests,
      pageLimit,
      searchCriteria,
      PAGINATION_LIST,
      emptyStringFiller,
    };
  },
});
</script>
