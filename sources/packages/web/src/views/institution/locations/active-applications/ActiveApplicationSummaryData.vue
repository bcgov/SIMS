<template>
  <body-header
    title="Applications"
    :recordsCount="applications.results?.length"
    class="m-1 mb-12"
  >
    <template #actions>
      <div class="search-box-display-width">
        <v-text-field
          label="Search name or application #"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          v-model="searchCriteria"
          @keyup.enter="searchActiveApplications"
        ></v-text-field>
      </div>
    </template>
  </body-header>
  <content-group>
    <toggle-content :toggled="!applications.results?.length">
      <DataTable
        :value="applications.results"
        :lazy="true"
        class="p-m-4"
        :paginator="true"
        :rows="pageLimit"
        :rowsPerPageOptions="rowsPerPageOptions"
        :totalRecords="applications.count"
        @page="pageEvent"
        @sort="sortEvent"
      >
        <template #empty>
          <p class="text-center font-weight-bold">No records found.</p>
        </template>
        <Column
          field="fullName"
          header="Name"
          :sortable="true"
          headerStyle="width: 20%"
        >
          <span>{{ data.fullName }}</span>
        </Column>
        <Column
          field="studyStartPeriod"
          header="Study dates"
          headerStyle="width: 20%"
        >
          <span>
            {{ dateString(data.studyStartPeriod) }} -
            {{ dateString(data.studyEndPeriod) }}
          </span>
        </Column>
        <Column
          headerStyle="width: 20%"
          field="applicationNumber"
          header="Application #"
          :sortable="true"
        ></Column>
        <Column
          field="applicationStatus"
          header="Status"
          headerStyle="width: 20%"
        >
          <template #body="slotProps">
            <StatusChipActiveApplication
              :status="slotProps.data.applicationSholasticStandingStatus"
            />
          </template>
        </Column>
        <Column header="Action" headerStyle="width: 20%">
          <template #body="slotProps">
            <v-btn
              v-if="
                slotProps.data.applicationSholasticStandingStatus ===
                ApplicationSholasticStandingStatus.Available
              "
              class="primary-btn-background"
              @click="goToViewApplication(slotProps.data.applicationId)"
              >Report a change</v-btn
            >
            <v-btn
              v-if="
                slotProps.data.applicationSholasticStandingStatus ===
                ApplicationSholasticStandingStatus.Completed
              "
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
import { onMounted, ref, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { InstitutionService } from "@/services/InstitutionService";
import {
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  DataTableSortOrder,
  DEFAULT_PAGE_NUMBER,
  PageAndSortEvent,
  PaginatedResults,
  ApplicationSholasticStandingStatus,
} from "@/types";
import { ActiveApplicationSummaryAPIOutDTO } from "@/services/http/dto";
import { useFormatters } from "@/composables";
import StatusChipActiveApplication from "@/components/generic/StatusChipActiveApplication.vue";
const DEFAULT_SORT_FIELD = "applicationNumber";

export default {
  components: {
    StatusChipActiveApplication,
  },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
    locationName: {
      type: String,
      required: true,
    },
    archived: {
      type: Boolean,
      required: true,
    },
  },

  setup(props: any) {
    const router = useRouter();
    const page = ref(DEFAULT_PAGE_NUMBER);
    const pageLimit = ref(DEFAULT_PAGE_LIMIT);
    const sortField = ref(DEFAULT_SORT_FIELD);
    const sortOrder = ref(DataTableSortOrder.ASC);
    const searchCriteria = ref();
    const { dateString } = useFormatters();
    const applications = ref(
      {} as PaginatedResults<ActiveApplicationSummaryAPIOutDTO>,
    );
    const rowsPerPageOptions = computed(() =>
      applications.value.results?.length > 10 ? PAGINATION_LIST : undefined,
    );

    const goToViewApplication = (applicationId: number) => {
      router.push({
        name: InstitutionRoutesConst.ACTIVE_APPLICATION_EDIT,
        params: { locationId: props.locationId, applicationId },
      });
    };

    const goToViewScholasticStanding = (scholasticStandingId: number) => {
      router.push({
        name: InstitutionRoutesConst.SCHOLASTIC_STANDING_VIEW,
        params: { locationId: props.locationId, scholasticStandingId },
      });
    };

    const getSummaryList = async (locationId: number) => {
      applications.value =
        await InstitutionService.shared.getActiveApplicationsSummary(
          locationId,
          {
            page: page.value,
            pageLimit: pageLimit.value,
            sortField: sortField.value,
            sortOrder: sortOrder.value,
            searchCriteria: searchCriteria.value,
          },
          props.archived,
        );
    };

    const pageEvent = async (event: PageAndSortEvent) => {
      page.value = event?.page;
      pageLimit.value = event?.rows;
      await getSummaryList(props.locationId);
    };

    const sortEvent = async (event: PageAndSortEvent) => {
      page.value = DEFAULT_PAGE_NUMBER;
      pageLimit.value = DEFAULT_PAGE_LIMIT;
      sortField.value = event.sortField;
      sortOrder.value = event.sortOrder;
      await getSummaryList(props.locationId);
    };

    const searchActiveApplications = async () => {
      page.value = DEFAULT_PAGE_NUMBER;
      pageLimit.value = DEFAULT_PAGE_LIMIT;
      await getSummaryList(props.locationId);
    };

    watch(
      () => props.locationId,
      async (currValue) => {
        //update the list
        await getSummaryList(currValue);
      },
    );

    onMounted(async () => {
      await getSummaryList(props.locationId);
    });

    return {
      ApplicationSholasticStandingStatus,
      applications,
      dateString,
      goToViewApplication,
      pageEvent,
      sortEvent,
      searchActiveApplications,
      pageLimit,
      rowsPerPageOptions,
      searchCriteria,
      goToViewScholasticStanding,
    };
  },
};
</script>
