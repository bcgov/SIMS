<template>
  <v-card class="mt-5">
    <v-container :fluid="true">
      <body-header :title="header" :recordsCount="disbursements.count">
        <template #subtitle>
          <slot name="coeSummarySubtitle">{{ coeSummarySubtitle }}</slot>
        </template>
        <template #actions>
          <v-row class="justify-end">
            <v-col cols="auto">
              <v-btn-toggle
                v-model="intensityFilter"
                class="btn-toggle"
                selected-class="selected-btn-toggle"
                @update:model-value="resetPageAndLoadEnrollments"
              >
                <v-btn
                  rounded="xl"
                  color="primary"
                  :value="IntensityFilter.All"
                  class="mr-2"
                  >All</v-btn
                >
                <v-btn
                  v-for="intensity in Object.values(OfferingIntensity)"
                  :key="intensity"
                  rounded="xl"
                  color="primary"
                  :value="intensity"
                  class="mr-2"
                  >{{ mapOfferingIntensity(intensity) }}</v-btn
                >
              </v-btn-toggle>
            </v-col>
            <v-col>
              <v-text-field
                density="compact"
                label="Search by name or application number"
                variant="outlined"
                v-model="searchQuery"
                @keyup.enter="resetPageAndLoadEnrollments"
                prepend-inner-icon="mdi-magnify"
                hide-details="auto"
              />
            </v-col>
          </v-row>
        </template>
      </body-header>
      <content-group>
        <toggle-content
          :toggled="!enrollmentsLoading && !disbursements.count"
          message="No enrollment records found"
        >
          <v-data-table-server
            :headers="COESummaryHeaders"
            :items="disbursements.results"
            :items-length="disbursements.count"
            :loading="enrollmentsLoading"
            :items-per-page="DEFAULT_PAGE_LIMIT"
            :items-per-page-options="ITEMS_PER_PAGE"
            @update:options="paginationAndSortEvent"
          >
            <template #[`item.fullName`]="{ item }">
              <span>{{ item.fullName }}</span>
            </template>
            <template #[`item.studyStartDate`]="{ item }">
              <span>
                {{ dateOnlyLongString(item.studyStartDate) }}
              </span>
            </template>
            <template #[`item.studyEndDate`]="{ item }">
              <span>
                {{ dateOnlyLongString(item.studyEndDate) }}
              </span>
            </template>
            <template #[`item.applicationNumber`]="{ item }">
              {{ item.applicationNumber }}
            </template>
            <template #[`item.offeringIntensity`]="{ item }">
              {{ mapOfferingIntensity(item.offeringIntensity) }}
            </template>
            <template #[`item.studentNumber`]="{ item }">
              {{ item.studentNumber }}
            </template>
            <template #[`item.disbursementDate`]="{ item }">
              <span>
                {{ dateOnlyLongString(item.disbursementDate) }}
              </span>
            </template>
            <template #[`item.coeStatus`]="{ item }">
              <status-chip-c-o-e :status="item.coeStatus" />
            </template>
            <template #[`item.applicationId`]="{ item }">
              <v-btn
                color="primary"
                @click="goToViewApplication(item.disbursementScheduleId)"
                >View</v-btn
              >
            </template>
          </v-data-table-server>
        </toggle-content>
      </content-group>
    </v-container>
  </v-card>
</template>

<script lang="ts">
import { ref, watch, computed, defineComponent, PropType } from "vue";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { ConfirmationOfEnrollmentService } from "@/services/ConfirmationOfEnrollmentService";
import {
  DataTableSortOrder,
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  PAGINATION_LIST,
  LayoutTemplates,
  EnrollmentPeriod,
  COESummaryHeaders,
  OfferingIntensity,
  PaginationOptions,
  DataTableOptions,
} from "@/types";
import { useFormatters, useOffering } from "@/composables";
import StatusChipCOE from "@/components/generic/StatusChipCOE.vue";
import {
  COESummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";

const DEFAULT_SORT_FIELD = "coeStatus";
const IntensityFilter = {
  All: "All",
  ...OfferingIntensity,
};

export default defineComponent({
  components: { StatusChipCOE },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
    header: {
      type: String,
      required: true,
    },
    coeSummarySubtitle: {
      type: String,
      required: false,
    },
    enrollmentPeriod: {
      type: String as PropType<EnrollmentPeriod>,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const { dateOnlyLongString } = useFormatters();
    const disbursements = ref(
      {} as PaginatedResultsAPIOutDTO<COESummaryAPIOutDTO>,
    );
    const { mapOfferingIntensity } = useOffering();
    const searchQuery = ref("");
    const enrollmentsLoading = ref(false);
    const intensityFilter = ref(IntensityFilter.All);
    const rowsPerPageOptions = computed(() =>
      disbursements.value.results?.length > 10 ? PAGINATION_LIST : undefined,
    );
    /**
     * Current state of the pagination.
     */
    const currentPagination: PaginationOptions = {
      page: 1,
      pageLimit: DEFAULT_PAGE_LIMIT,
      sortField: DEFAULT_SORT_FIELD,
      sortOrder: DataTableSortOrder.DESC,
    };

    const goToViewApplication = (disbursementScheduleId: number) => {
      router.push({
        name: InstitutionRoutesConst.COE_EDIT,
        params: {
          locationId: props.locationId,
          disbursementScheduleId: disbursementScheduleId,
        },
      });
    };

    const updateSummaryList = async (locationId: number) => {
      try {
        debugger;
        enrollmentsLoading.value = true;
        const paginationOptions: PaginationOptions = {
          page: currentPagination.page,
          pageLimit: currentPagination.pageLimit,
          sortField: currentPagination.sortField,
          sortOrder: currentPagination.sortOrder,
        };
        if (
          intensityFilter.value &&
          intensityFilter.value !== IntensityFilter.All
        ) {
          paginationOptions.searchCriteria = {
            searchCriteria: searchQuery.value,
            intensityFilter: intensityFilter.value as OfferingIntensity,
          };
        } else {
          paginationOptions.searchCriteria = {
            searchCriteria: searchQuery.value,
          };
        }
        const disbursementAndCount =
          await ConfirmationOfEnrollmentService.shared.getCOESummary(
            locationId,
            props.enrollmentPeriod,
            paginationOptions,
          );
        disbursements.value = disbursementAndCount;
      } catch (error: unknown) {
        console.error("Error loading confirmation of enrollments:", error);
        disbursements.value = { results: [], count: 0 };
      } finally {
        enrollmentsLoading.value = false;
      }
    };

    const resetPageAndLoadEnrollments = async () => {
      await updateSummaryList(props.locationId);
    };

    const paginationAndSortEvent = async (event: DataTableOptions) => {
      debugger;
      currentPagination.page = event.page;
      currentPagination.pageLimit = event.itemsPerPage;
      if (event.sortBy.length) {
        const [sortBy] = event.sortBy;
        currentPagination.sortField = sortBy.key;
        currentPagination.sortOrder = sortBy.order;
      } else {
        // Sorting was removed, reset to default.
        currentPagination.sortField = DEFAULT_SORT_FIELD;
        currentPagination.sortOrder = DataTableSortOrder.DESC;
      }
      await updateSummaryList(props.locationId);
    };

    watch(
      () => props.locationId,
      async (currValue) => {
        //update the list
        searchQuery.value = "";
        intensityFilter.value = IntensityFilter.All;
        disbursements.value = { results: [], count: 0 };
        await updateSummaryList(currValue);
      },
      {
        immediate: true,
      },
    );

    return {
      disbursements,
      dateOnlyLongString,
      goToViewApplication,
      rowsPerPageOptions,
      searchQuery,
      intensityFilter,
      IntensityFilter,
      LayoutTemplates,
      COESummaryHeaders,
      paginationAndSortEvent,
      enrollmentsLoading,
      resetPageAndLoadEnrollments,
      OfferingIntensity,
      mapOfferingIntensity,
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
    };
  },
});
</script>
