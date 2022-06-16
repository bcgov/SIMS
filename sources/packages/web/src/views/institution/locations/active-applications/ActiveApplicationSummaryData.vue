<template>
  <body-header
    title="Applications"
    :recordsCount="applications.results?.length"
    class="m-1"
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
  <br />
  <content-group>
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
      <Column field="fullName" header="Name" :sortable="true">
        <template #body="slotProps">
          <span>{{ slotProps.data.fullName }}</span>
        </template>
      </Column>
      <Column field="studyStartPeriod" header="Study dates">
        <template #body="slotProps">
          <span>
            {{ dateString(slotProps.data.studyStartPeriod) }} -
            {{ dateString(slotProps.data.studyEndPeriod) }}
          </span>
        </template></Column
      >
      <Column
        field="applicationNumber"
        header="Application #"
        :sortable="true"
      ></Column>
      <Column field="applicationStatus" header="Status">
        <template #body="slotProps">
          <StatusChipActiveApplication
            :status="slotProps.data.applicationStatus"
          />
        </template>
      </Column>
      <Column header="Action">
        <template #body="slotProps">
          <v-btn
            v-if="
              slotProps.data.applicationStatus === ApplicationStatus.available
            "
            class="primary-btn-background"
            @click="goToViewApplication(slotProps.data.applicationId)"
            >Report a change</v-btn
          >
          <v-btn
            v-if="
              slotProps.data.applicationStatus === ApplicationStatus.completed
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
  </content-group>
</template>

<script lang="ts">
import { onMounted, ref, watch, computed, PropType } from "vue";
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
  ApplicationStatus,
} from "@/types";
import { ActiveApplicationSummaryAPIOutDTO } from "@/services/http/dto";
import { useFormatters } from "@/composables";
const DEFAULT_SORT_FIELD = "applicationNumber";
import StatusChipActiveApplication from "@/components/generic/StatusChipActiveApplication.vue";

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
    applicationStatus: {
      type: String,
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

    const updateSummaryList = async (locationId: number) => {
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
          props.applicationStatus,
        );
    };

    const pageEvent = async (event: PageAndSortEvent) => {
      page.value = event?.page;
      pageLimit.value = event?.rows;
      await updateSummaryList(props.locationId);
    };

    const sortEvent = async (event: PageAndSortEvent) => {
      page.value = DEFAULT_PAGE_NUMBER;
      pageLimit.value = DEFAULT_PAGE_LIMIT;
      sortField.value = event.sortField;
      sortOrder.value = event.sortOrder;
      await updateSummaryList(props.locationId);
    };

    const searchActiveApplications = async () => {
      page.value = DEFAULT_PAGE_NUMBER;
      pageLimit.value = DEFAULT_PAGE_LIMIT;
      await updateSummaryList(props.locationId);
    };

    watch(
      () => props.locationId,
      async (currValue) => {
        //update the list
        await updateSummaryList(currValue);
      },
    );

    onMounted(async () => {
      await updateSummaryList(props.locationId);
    });

    return {
      ApplicationStatus,
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
