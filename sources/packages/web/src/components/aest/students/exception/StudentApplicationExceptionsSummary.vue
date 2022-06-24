<template>
  <body-header
    title="Requested exceptions"
    :recordsCount="applicationExceptions.results?.length"
    class="m-1"
  >
    <template #actions>
      <v-text-field
        class="v-text-field-search-width"
        density="compact"
        label="Search name or application #"
        variant="outlined"
        v-model="searchCriteria"
        @keyup.enter="searchExceptions"
      >
        <template v-slot:prependInner>
          <font-awesome-icon :icon="['fas', 'search']" class="m" />
        </template>
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
        <Column field="submittedDate" header="Date submitted">
          <template #body="slotProps">
            <span>
              {{ dateOnlyLongString(slotProps.data.submittedDate) }}
            </span>
          </template>
        </Column>
        <Column field="fullName" header="Name" :sortable="true"> </Column>
        <Column
          field="applicationNumber"
          header="Application #"
          :sortable="true"
        ></Column>

        <Column header="Action">
          <template #body="slotProps">
            <v-btn
              class="primary-btn-background"
              @click="
                goToViewScholasticStanding(slotProps.data.scholasticStandingId)
              "
              >View</v-btn
            >
          </template>
        </Column>
      </DataTable>
    </toggle-content>
  </content-group>
</template>

<script lang="ts">
import { ref, onMounted } from "vue";
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
import { ApplicationExceptionSummaryAPIOutDTO } from "@/services/http/dto";
import { useFormatters } from "@/composables";

const DEFAULT_SORT_FIELD = "applicationNumber";

export default {
  setup(props: any) {
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

    const getExceptionList = async () => {
      applicationExceptions.value =
        await ApplicationExceptionService.shared.getExceptions({
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
};
</script>
