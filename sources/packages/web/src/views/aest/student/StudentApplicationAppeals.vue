<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator title="Student requests" subTitle="Appeals" />
    </template>
    <body-header
      title="Requested appeals"
      :recordsCount="applicationAppeals.count"
      subTitle="Make a determination on requested change(s) that may require a reassessment"
    >
      <template #actions>
        <v-text-field
          density="compact"
          label="Search name or application #"
          variant="outlined"
          v-model="searchCriteria"
          @keyup.enter="searchAppeals"
          prepend-inner-icon="mdi-magnify"
          hide-details="auto"
        >
        </v-text-field>
      </template>
    </body-header>
    <content-group>
      <toggle-content :toggled="!applicationAppeals.results?.length">
        <DataTable
          :value="applicationAppeals.results"
          :lazy="true"
          class="p-m-4"
          :paginator="true"
          :rows="pageLimit"
          :rowsPerPageOptions="PAGINATION_LIST"
          :totalRecords="applicationAppeals.count"
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
          <Column field="fullName" header="Name" :sortable="true"> </Column>
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
                  gotToAssessmentsSummary(
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
import { StudentAppealService } from "@/services/StudentAppealService";

const DEFAULT_SORT_FIELD = "submittedDate";

export default defineComponent({
  setup() {
    const router = useRouter();
    const page = ref(DEFAULT_PAGE_NUMBER);
    const pageLimit = ref(DEFAULT_PAGE_LIMIT);
    const sortField = ref(DEFAULT_SORT_FIELD);
    const sortOrder = ref(DataTableSortOrder.ASC);
    const searchCriteria = ref();
    const { dateOnlyLongString } = useFormatters();
    const applicationAppeals = ref(
      {} as PaginatedResults<StudentAppealPendingSummaryAPIOutDTO>,
    );

    const gotToAssessmentsSummary = (
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

    const getAppealList = async () => {
      applicationAppeals.value =
        await StudentAppealService.shared.getPendingAppeals({
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
      await getAppealList();
    };

    const sortEvent = async (event: PageAndSortEvent) => {
      page.value = DEFAULT_PAGE_NUMBER;
      pageLimit.value = DEFAULT_PAGE_LIMIT;
      sortField.value = event.sortField;
      sortOrder.value = event.sortOrder;
      await getAppealList();
    };

    const searchAppeals = async () => {
      page.value = DEFAULT_PAGE_NUMBER;
      pageLimit.value = DEFAULT_PAGE_LIMIT;
      await getAppealList();
    };

    onMounted(async () => {
      await getAppealList();
    });

    return {
      gotToAssessmentsSummary,
      applicationAppeals,
      dateOnlyLongString,
      pageEvent,
      sortEvent,
      searchAppeals,
      pageLimit,
      searchCriteria,
      PAGINATION_LIST,
    };
  },
});
</script>
