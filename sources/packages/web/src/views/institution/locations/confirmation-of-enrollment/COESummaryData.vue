<template>
  <v-card class="mt-5">
    <v-container :fluid="true">
      <body-header
        :title="header"
        title-header-level="2"
        :recordsCount="disbursements.results?.length"
      >
        <template #subtitle>
          <slot name="coeSummarySubtitle">{{ coeSummarySubtitle }}</slot>
        </template>
        <template #actions>
          <v-text-field
            density="compact"
            label="Search Name"
            variant="outlined"
            v-model="searchCriteria"
            data-cy="searchCriteria"
            @keyup.enter="searchCOE"
            prepend-inner-icon="mdi-magnify"
            hide-details="auto"
          />
        </template>
      </body-header>
      <content-group>
        <toggle-content :toggled="!disbursements.count">
          <DataTable
            :value="disbursements.results"
            :lazy="true"
            :paginator="true"
            :rows="pageLimit"
            :rowsPerPageOptions="rowsPerPageOptions"
            :totalRecords="disbursements.count"
            @page="pageEvent"
            @sort="sortEvent"
          >
            <Column field="fullName" header="Name" :sortable="true">
              <template #body="slotProps">
                <span>{{ slotProps.data.fullName }}</span>
              </template>
            </Column>
            <Column field="studyStartPeriod" header="Study dates">
              <template #body="slotProps">
                <span>
                  {{ dateOnlyLongString(slotProps.data.studyStartPeriod) }} -
                  {{ dateOnlyLongString(slotProps.data.studyEndPeriod) }}
                </span>
              </template></Column
            >
            <Column field="applicationNumber" header="Application #"></Column>
            <Column field="disbursementDate" header="Disbursement date">
              <template #body="slotProps">
                <span>
                  {{ dateOnlyLongString(slotProps.data.disbursementDate) }}
                </span>
              </template></Column
            >
            <Column field="coeStatus" header="Status" :sortable="true">
              <template #body="slotProps">
                <status-chip-c-o-e :status="slotProps.data.coeStatus" />
              </template>
            </Column>
            <Column field="applicationId" header="Action">
              <template #body="slotProps">
                <v-btn
                  color="primary"
                  @click="
                    goToViewApplication(slotProps.data.disbursementScheduleId)
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
import { ref, watch, computed, defineComponent, PropType } from "vue";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { ConfirmationOfEnrollmentService } from "@/services/ConfirmationOfEnrollmentService";
import {
  DataTableSortOrder,
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  DEFAULT_PAGE_NUMBER,
  PageAndSortEvent,
  LayoutTemplates,
  EnrollmentPeriod,
} from "@/types";
import { useFormatters } from "@/composables";
import StatusChipCOE from "@/components/generic/StatusChipCOE.vue";
import {
  COESummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";

const DEFAULT_SORT_FIELD = "coeStatus";

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
    const page = ref(DEFAULT_PAGE_NUMBER);
    const pageLimit = ref(DEFAULT_PAGE_LIMIT);
    const sortField = ref(DEFAULT_SORT_FIELD);
    const sortOrder = ref(DataTableSortOrder.ASC);
    const searchCriteria = ref();
    const rowsPerPageOptions = computed(() =>
      disbursements.value.results?.length > 10 ? PAGINATION_LIST : undefined,
    );

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
      const disbursementAndCount =
        await ConfirmationOfEnrollmentService.shared.getCOESummary(
          locationId,
          props.enrollmentPeriod,
          {
            page: page.value,
            pageLimit: pageLimit.value,
            sortField: sortField.value,
            sortOrder: sortOrder.value,
            searchCriteria: searchCriteria.value,
          },
        );
      disbursements.value = disbursementAndCount;
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

    const searchCOE = async () => {
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
      {
        immediate: true,
      },
    );

    return {
      disbursements,

      dateOnlyLongString,
      goToViewApplication,
      pageLimit,
      rowsPerPageOptions,
      searchCriteria,
      pageEvent,
      sortEvent,
      searchCOE,
      LayoutTemplates,
    };
  },
});
</script>
