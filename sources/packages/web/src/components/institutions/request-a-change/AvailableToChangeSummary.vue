<template>
  <tab-container>
    <body-header-container>
      <template #header>
        <body-header
          title="Applications"
          :recordsCount="applications.results?.length"
        >
          <template #actions>
            <v-text-field
              density="compact"
              label="Search name or application #"
              variant="outlined"
              v-model="searchCriteria"
              data-cy="searchCriteria"
              @keyup.enter="searchActiveApplications"
              prepend-inner-icon="mdi-magnify"
              hide-details="auto"
            >
            </v-text-field>
          </template>
        </body-header>
        <content-group>
          <toggle-content :toggled="!applications.results?.length">
            <!-- todo: ann use vuetify datatable -->
            <DataTable
              :value="applications.results"
              :lazy="true"
              :paginator="true"
              :rows="pageLimit"
              :rowsPerPageOptions="PAGINATION_LIST"
              :totalRecords="applications.count"
              @page="pageEvent"
              @sort="sortEvent"
            >
              <Column field="fullName" header="Name" :sortable="true"> </Column>
              <Column field="studyStartPeriod" header="Study dates">
                <template #body="slotProps">
                  <span>
                    {{ dateOnlyLongString(slotProps.data.studyStartPeriod) }} -
                    {{ dateOnlyLongString(slotProps.data.studyEndPeriod) }}
                  </span>
                </template>
              </Column>
              <Column
                field="applicationNumber"
                header="Application #"
                :sortable="true"
              ></Column>
              <Column header="Action">
                <template #body>
                  <v-btn color="primary">Request a change</v-btn>
                </template>
              </Column>
            </DataTable>
          </toggle-content>
        </content-group>
      </template>
    </body-header-container>
  </tab-container>
</template>

<script lang="ts">
import { ref, watch, defineComponent } from "vue";
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
  ApplicationScholasticStandingStatus,
  LayoutTemplates,
} from "@/types";
import { ApplicationOfferingChangeSummaryAPIOutDTO } from "@/services/http/dto";
import { useFormatters } from "@/composables";

const DEFAULT_SORT_FIELD = "applicationNumber";

export default defineComponent({
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },

  setup(props) {
    const router = useRouter();
    const page = ref(DEFAULT_PAGE_NUMBER);
    const pageLimit = ref(DEFAULT_PAGE_LIMIT);
    const sortField = ref(DEFAULT_SORT_FIELD);
    const sortOrder = ref(DataTableSortOrder.ASC);
    const searchCriteria = ref();
    const { dateOnlyLongString } = useFormatters();
    const applications = ref(
      {} as PaginatedResults<ApplicationOfferingChangeSummaryAPIOutDTO>,
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
        await InstitutionService.shared.getEligibleApplicationOfferingChangeApplications(
          locationId,
          {
            page: page.value,
            pageLimit: pageLimit.value,
            sortField: sortField.value,
            sortOrder: sortOrder.value,
            searchCriteria: searchCriteria.value,
          },
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
      { immediate: true },
    );

    return {
      ApplicationScholasticStandingStatus,
      applications,
      dateOnlyLongString,
      goToViewApplication,
      pageEvent,
      sortEvent,
      searchActiveApplications,
      pageLimit,
      searchCriteria,
      goToViewScholasticStanding,
      PAGINATION_LIST,
      LayoutTemplates,
    };
  },
});
</script>
