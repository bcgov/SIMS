<template>
  <body-header
    :title="header"
    :subTitle="subTitle"
    :recordsCount="disbursements.results?.length"
    class="m-1"
  >
    <template #actions>
      <InputText
        type="text"
        placeholder="Search name"
        v-model="searchCriteria"
        @keyup.enter="searchCOE"
      />
      <v-btn class="ml-2 primary-btn-background" @click="searchCOE"
        ><font-awesome-icon :icon="['fas', 'search']" class="mr-2"
      /></v-btn>
    </template>
  </body-header>
  <content-group>
    <DataTable
      :value="disbursements.results"
      :lazy="true"
      class="p-m-4"
      :paginator="true"
      :rows="pageLimit"
      :rowsPerPageOptions="rowsPerPageOptions"
      :totalRecords="disbursements.count"
      @page="pageEvent"
      @sort="sortEvent"
    >
      <template #empty>
        <p class="text-center font-weight-bold">No records found.</p>
      </template>
      <Column field="fullName" header="Name" sortable="true">
        <template #body="slotProps">
          <span>{{ slotProps.data.fullName }}</span>
        </template>
      </Column>
      <Column field="studyStartPeriod" header="Study Period">
        <template #body="slotProps">
          <span>
            {{ dateString(slotProps.data.studyStartPeriod) }} -
            {{ dateString(slotProps.data.studyEndPeriod) }}
          </span>
        </template></Column
      >
      <Column field="applicationNumber" header="Application #"></Column>
      <Column field="disbursementDate" header="Disbursement Date">
        <template #body="slotProps">
          <span>
            {{ dateOnlyLongString(slotProps.data.disbursementDate) }}
          </span>
        </template></Column
      >
      <Column field="coeStatus" header="Status" sortable="true">
        <template #body="slotProps">
          <COEStatusBadge :status="slotProps.data.coeStatus" />
        </template>
      </Column>
      <Column field="applicationId" header="">
        <template #body="slotProps">
          <v-btn
            :color="COLOR_BLUE"
            variant="outlined"
            @click="goToViewApplication(slotProps.data.disbursementScheduleId)"
            >view</v-btn
          >
        </template>
      </Column>
    </DataTable>
  </content-group>
</template>

<script lang="ts">
import { onMounted, ref, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import { ConfirmationOfEnrollmentService } from "@/services/ConfirmationOfEnrollmentService";
import {
  PaginatedResults,
  COESummaryDTO,
  DataTableSortOrder,
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  DEFAULT_PAGE_NUMBER,
  PageAndSortEvent,
} from "@/types";
import { useFormatters } from "@/composables";
import { COLOR_BLUE } from "@/constants";
import COEStatusBadge from "@/components/generic/COEStatusBadge.vue";
import ContentGroup from "@/components/generic/ContentGroup.vue";
import BodyHeader from "@/components/generic/BodyHeader.vue";
const DEFAULT_SORT_FIELD = "coeStatus";

export default {
  components: { COEStatusBadge, ContentGroup, BodyHeader },
  props: {
    locationId: {
      type: Number,
      required: true,
    },
    header: {
      type: String,
      required: true,
    },
    subTitle: {
      type: String,
      required: true,
    },
    enrollmentPeriod: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const router = useRouter();
    const { dateString, dateOnlyLongString } = useFormatters();
    const disbursements = ref({} as PaginatedResults<COESummaryDTO>);
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
    );

    onMounted(async () => {
      await updateSummaryList(props.locationId);
    });

    return {
      disbursements,
      dateString,
      dateOnlyLongString,
      goToViewApplication,
      pageLimit,
      rowsPerPageOptions,
      COLOR_BLUE,
      searchCriteria,
      pageEvent,
      sortEvent,
      searchCOE,
    };
  },
};
</script>
