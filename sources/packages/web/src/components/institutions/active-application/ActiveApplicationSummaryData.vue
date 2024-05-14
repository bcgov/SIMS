<template>
  <v-card class="mt-5">
    <v-container :fluid="true">
      <body-header
        title="Applications"
        title-header-level="2"
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
            <Column field="applicationStatus" header="Status">
              <template #body="slotProps">
                <status-chip-active-application
                  :status="slotProps.data.applicationScholasticStandingStatus"
                />
              </template>
            </Column>
            <Column header="Action">
              <template #body="slotProps">
                <v-btn
                  v-if="
                    slotProps.data.applicationScholasticStandingStatus ===
                    ApplicationScholasticStandingStatus.Available
                  "
                  color="primary"
                  @click="goToViewApplication(slotProps.data.applicationId)"
                  >Report a change</v-btn
                >
                <v-btn
                  v-if="
                    slotProps.data.applicationScholasticStandingStatus ===
                    ApplicationScholasticStandingStatus.Completed
                  "
                  color="primary"
                  @click="
                    goToViewScholasticStanding(
                      slotProps.data.scholasticStandingId,
                    )
                  "
                  >View</v-btn
                >
              </template>
            </Column>
          </DataTable>
        </toggle-content>
      </content-group>
    </v-container>
  </v-card>
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
import { ActiveApplicationSummaryAPIOutDTO } from "@/services/http/dto";
import { useFormatters } from "@/composables";
import StatusChipActiveApplication from "@/components/generic/StatusChipActiveApplication.vue";

const DEFAULT_SORT_FIELD = "applicationNumber";

export default defineComponent({
  components: {
    StatusChipActiveApplication,
  },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
    archived: {
      type: Boolean,
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
      {} as PaginatedResults<ActiveApplicationSummaryAPIOutDTO>,
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
