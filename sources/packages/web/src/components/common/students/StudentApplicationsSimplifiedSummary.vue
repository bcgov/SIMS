<!-- This component is shared between ministry and institution users. -->
<template>
  <body-header-container>
    <template #header>
      <body-header
        title="Applications"
        :recordsCount="applicationsAndCount.count"
      ></body-header>
    </template>
    <content-group>
      <toggle-content
        :toggled="!applicationsAndCount.count"
        message="No applications are currently available."
      >
        <v-data-table-server
          :headers="StudentApplicationsSimplifiedSummaryHeaders"
          :items="applicationsAndCount.results"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          :items-length="applicationsAndCount.count"
          :loading="loading"
          :mobile="isMobile"
          @update:options="paginationAndSortEvent"
        >
          <template #[`item.applicationNumber`]="{ item }">
            {{ item.applicationNumber }}
          </template>
          <template #[`item.submitted`]="{ item }">
            {{
              emptyStringFiller(getISODateHourMinuteString(item.submittedDate))
            }}
          </template>
          <template #[`item.studyStartPeriod`]="{ item }">
            {{
              dateOnlyLongPeriodString(
                item.studyStartPeriod,
                item.studyEndPeriod,
              )
            }}
          </template>
          <template #[`item.status`]="{ item }">
            <status-chip-application :status="item.status" />
          </template>
          <template #[`item.actions`]="{ item }">
            <v-btn
              color="primary"
              variant="outlined"
              @click="$emit('goToApplication', item.id)"
              >View</v-btn
            >
          </template>
        </v-data-table-server>
      </toggle-content>
    </content-group>
  </body-header-container>
</template>

<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import {
  DEFAULT_PAGE_LIMIT,
  DataTableSortOrder,
  StudentApplicationFields,
  StudentApplicationsSimplifiedSummaryHeaders,
  ITEMS_PER_PAGE,
  DataTableOptions,
  PaginationOptions,
} from "@/types";
import { ApplicationService } from "@/services/ApplicationService";
import { useFormatters } from "@/composables";
import StatusChipApplication from "@/components/generic/StatusChipApplication.vue";
import {
  ApplicationSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import { useDisplay } from "vuetify";

export default defineComponent({
  components: { StatusChipApplication },
  emits: {
    goToApplication: (applicationId: number) => {
      return !!applicationId && applicationId > 0;
    },
  },
  props: {
    studentId: {
      type: Number,
      required: false,
    },
  },
  setup(props) {
    const loading = ref(false);
    const { mobile: isMobile } = useDisplay();
    const applicationsAndCount = ref(
      {} as PaginatedResultsAPIOutDTO<ApplicationSummaryAPIOutDTO>,
    );
    const {
      getISODateHourMinuteString,
      dateOnlyLongPeriodString,
      emptyStringFiller,
    } = useFormatters();
    const DEFAULT_SORT_FIELD = StudentApplicationFields.Status;
    const currentPagination = ref<PaginationOptions>({
      page: 1,
      pageLimit: DEFAULT_PAGE_LIMIT,
      sortField: DEFAULT_SORT_FIELD,
      sortOrder: DataTableSortOrder.DESC,
    });

    const getStudentApplications = async () => {
      try {
        loading.value = true;
        applicationsAndCount.value =
          await ApplicationService.shared.getStudentApplicationSummary(
            currentPagination.value.page - 1,
            currentPagination.value.pageLimit,
            currentPagination.value.sortField as StudentApplicationFields,
            currentPagination.value.sortOrder as DataTableSortOrder,
            props.studentId,
          );
      } finally {
        loading.value = false;
      }
    };

    onMounted(getStudentApplications);

    const paginationAndSortEvent = async (event: DataTableOptions) => {
      currentPagination.value.page = event.page;
      currentPagination.value.pageLimit = event.itemsPerPage;
      if (event.sortBy.length) {
        const [sortBy] = event.sortBy;
        currentPagination.value.sortField =
          sortBy.key as StudentApplicationFields;
        currentPagination.value.sortOrder =
          sortBy.order === "desc"
            ? DataTableSortOrder.DESC
            : DataTableSortOrder.ASC;
      } else {
        // Sorting was removed, reset to default
        currentPagination.value.sortField = DEFAULT_SORT_FIELD;
        currentPagination.value.sortOrder = DataTableSortOrder.ASC;
      }
      await getStudentApplications();
    };

    return {
      getISODateHourMinuteString,
      emptyStringFiller,
      dateOnlyLongPeriodString,
      applicationsAndCount,
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      loading,
      StudentApplicationFields,
      StudentApplicationsSimplifiedSummaryHeaders,
      isMobile,
      paginationAndSortEvent,
    };
  },
});
</script>
