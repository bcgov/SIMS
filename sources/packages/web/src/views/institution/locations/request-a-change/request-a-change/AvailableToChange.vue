<template>
  <tab-container>
    <body-header-container>
      <template #header>
        <body-header
          title="Applications"
          title-header-level="2"
          :recordsCount="applications?.count"
        >
          <template #subtitle>
            Request a change for a program and offering in an application
            <tooltip-icon
              >Only applications in the "completed status" are shown below to
              request a change.
            </tooltip-icon>
          </template>
          <template #actions>
            <v-text-field
              density="compact"
              label="Search name or application #"
              variant="outlined"
              v-model="searchCriteria"
              @keyup.enter="searchApplicationOfferingChangeRecords"
              prepend-inner-icon="mdi-magnify"
              hide-details="auto"
            >
            </v-text-field>
          </template>
        </body-header>
      </template>
      <content-group>
        <toggle-content :toggled="!applications?.count">
          <v-data-table-server
            v-if="applications?.count"
            :headers="AvailableToChangeOfferingChangeSummaryHeaders"
            :items="applications?.results"
            :items-length="applications?.count"
            :loading="loading"
            item-value="applicationId"
            v-model:items-per-page="DEFAULT_PAGE_LIMIT"
            @update:options="paginationAndSortEvent"
          >
            <template #[`item.fullName`]="{ item }">
              {{ item.fullName }}
            </template>
            <template #[`item.studyStartDate`]="{ item }">
              {{ dateOnlyLongString(item.studyStartDate) }}
              -
              {{ dateOnlyLongString(item.studyEndDate) }}
            </template>
            <template #[`item.applicationNumber`]="{ item }">
              {{ item.applicationNumber }}
            </template>
            <template #[`item.applicationId`]="{ item }">
              <v-btn color="primary" @click="requestAChange(item.applicationId)"
                >Request a change</v-btn
              >
            </template>
          </v-data-table-server>
        </toggle-content>
      </content-group>
    </body-header-container>
  </tab-container>
</template>

<script lang="ts">
import { ref, watch, defineComponent } from "vue";
import {
  DEFAULT_PAGE_LIMIT,
  DataTableOptions,
  PaginatedResults,
  AvailableToChangeOfferingChangeSummaryHeaders,
  DataTableSortByOrder,
  DEFAULT_DATATABLE_PAGE_NUMBER,
} from "@/types";
import { useFormatters } from "@/composables";
import { ApplicationOfferingChangeSummaryAPIOutDTO } from "@/services/http/dto";
import { ApplicationOfferingChangeRequestService } from "@/services/ApplicationOfferingChangeRequestService";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";

export default defineComponent({
  props: {
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const loading = ref(false);
    const searchCriteria = ref("");
    const { dateOnlyLongString } = useFormatters();
    const applications = ref(
      {} as
        | PaginatedResults<ApplicationOfferingChangeSummaryAPIOutDTO>
        | undefined,
    );
    let currentPage = NaN;
    let currentPageLimit = NaN;

    /**
     * Load eligible applications offering change records for institution.
     * @param page page number, if nothing passed then {@link DEFAULT_DATATABLE_PAGE_NUMBER}.
     * @param pageCount page limit, if nothing passed then {@link DEFAULT_PAGE_LIMIT}.
     * @param sortField sort field, if nothing passed then api sorts with application number.
     * @param sortOrder sort oder, if nothing passed then {@link DataTableSortByOrder.ASC}.
     */
    const getSummaryList = async (
      page = DEFAULT_DATATABLE_PAGE_NUMBER,
      pageCount = DEFAULT_PAGE_LIMIT,
      sortField?: string,
      sortOrder?: DataTableSortByOrder,
    ) => {
      loading.value = true;
      applications.value =
        await ApplicationOfferingChangeRequestService.shared.getEligibleApplications(
          props.locationId,
          {
            page,
            sortField,
            sortOrder,
            pageLimit: pageCount,
            searchCriteria: searchCriteria.value,
          },
        );
      loading.value = false;
    };

    // Pagination sort event callback.
    const paginationAndSortEvent = async (event: DataTableOptions) => {
      currentPage = event.page;
      currentPageLimit = event.itemsPerPage;
      const [sortByOptions] = event.sortBy;
      await getSummaryList(
        event.page,
        event.itemsPerPage,
        sortByOptions?.key,
        sortByOptions?.order,
      );
    };

    // Search table.
    const searchApplicationOfferingChangeRecords = async () => {
      // Fix for the search pagination issue.
      applications.value = undefined;
      await getSummaryList(
        currentPage ?? DEFAULT_DATATABLE_PAGE_NUMBER,
        currentPageLimit ?? DEFAULT_PAGE_LIMIT,
      );
    };

    /**
     * Navigate to the form to allow the request submission.
     * @param applicationId application to have the request created.
     */
    const requestAChange = (applicationId: any) => {
      router.push({
        name: InstitutionRoutesConst.REQUEST_CHANGE_FORM_SUBMIT,
        params: {
          locationId: props.locationId,
          applicationId,
        },
      });
    };

    watch(
      () => props.locationId,
      async () => {
        // Update the list.
        await getSummaryList();
      },
      { immediate: true },
    );

    return {
      DEFAULT_PAGE_LIMIT,
      applications,
      dateOnlyLongString,
      paginationAndSortEvent,
      searchApplicationOfferingChangeRecords,
      searchCriteria,
      AvailableToChangeOfferingChangeSummaryHeaders,
      loading,
      requestAChange,
    };
  },
});
</script>
