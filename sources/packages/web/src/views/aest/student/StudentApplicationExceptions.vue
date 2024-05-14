<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator title="Student requests" subTitle="Exceptions" />
    </template>
    <body-header
      title="Requested exceptions"
      :recordsCount="applicationExceptions.results?.length"
      subTitle="Make a determination on application submitted with exceptions."
    >
      <template #actions>
        <v-text-field
          density="compact"
          label="Search name or application #"
          variant="outlined"
          v-model="searchCriteria"
          data-cy="searchExceptions"
          @keyup.enter="searchExceptions"
          prepend-inner-icon="mdi-magnify"
          hide-details="auto"
        >
        </v-text-field>
      </template>
    </body-header>
    <content-group>
      <toggle-content :toggled="!applicationExceptions.results?.length">
        <DataTable
          :value="applicationExceptions.results"
          :lazy="true"
          class="p-m-4"
          :paginator="true"
          :rows="pageLimit"
          :rowsPerPageOptions="PAGINATION_LIST"
          :totalRecords="applicationExceptions.count"
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
import { ApplicationExceptionService } from "@/services/ApplicationExceptionService";
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
import { ApplicationExceptionSummaryAPIOutDTO } from "@/services/http/dto/ApplicationException.dto";

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
    const applicationExceptions = ref(
      {} as PaginatedResults<ApplicationExceptionSummaryAPIOutDTO>,
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

    const getExceptionList = async () => {
      applicationExceptions.value =
        await ApplicationExceptionService.shared.getPendingExceptions({
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
      await getExceptionList();
    };

    const sortEvent = async (event: PageAndSortEvent) => {
      page.value = DEFAULT_PAGE_NUMBER;
      pageLimit.value = DEFAULT_PAGE_LIMIT;
      sortField.value = event.sortField;
      sortOrder.value = event.sortOrder;
      await getExceptionList();
    };

    const searchExceptions = async () => {
      page.value = DEFAULT_PAGE_NUMBER;
      pageLimit.value = DEFAULT_PAGE_LIMIT;
      await getExceptionList();
    };

    onMounted(async () => {
      await getExceptionList();
    });

    return {
      gotToAssessmentsSummary,
      applicationExceptions,
      dateOnlyLongString,
      pageEvent,
      sortEvent,
      searchExceptions,
      pageLimit,
      searchCriteria,
      PAGINATION_LIST,
    };
  },
});
</script>
