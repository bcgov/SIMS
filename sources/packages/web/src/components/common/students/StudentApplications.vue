<template>
  <!-- This component is shared between ministry and student users -->
  <body-header-container>
    <template #header>
      <body-header
        title="Applications"
        :recordsCount="applicationsAndCount.count"
      ></body-header>
    </template>
    <content-group>
      <toggle-content
        :toggled="!applicationsAndCount.results?.length"
        message="No applications are currently available."
      >
        <v-data-table-server
          :headers="StudentApplicationsSummaryHeaders"
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
          <template #[`item.applicationName`]="{ item }">
            <v-btn
              v-if="enableViewApplicationOnName"
              variant="plain"
              @click="$emit('goToApplication', item.id)"
              color="primary"
              >{{ item.applicationName }}
              <v-tooltip activator="parent" location="start"
                >Click To View this Application</v-tooltip
              >
            </v-btn>
            <span v-if="!enableViewApplicationOnName"
              >{{ item.applicationName }}
            </span>
          </template>
          <template #[`item.studyStartPeriod`]="{ item }">
            {{ dateOnlyLongString(item.studyStartPeriod) }} -
            {{ dateOnlyLongString(item.studyEndPeriod) }}
          </template>
          <template #[`item.status`]="{ item }">
            <status-chip-application
              :status="item.status as ApplicationStatus"
            />
          </template>
          <template #[`item.actions`]="{ item }">
            <span v-if="manageApplication">
              <span
                v-if="
                  !(
                    item.status === ApplicationStatus.Cancelled ||
                    item.status === ApplicationStatus.Completed
                  )
                "
              >
                <v-btn
                  :disabled="sinValidStatus !== SINStatusEnum.VALID"
                  variant="plain"
                  color="primary"
                  class="label-bold"
                  @click="$emit('editApplicationAction', item.status, item.id)"
                  append-icon="mdi-pencil-outline"
                  ><span class="label-bold">Edit</span>
                  <v-tooltip activator="parent" location="start"
                    >Click To Edit this Application</v-tooltip
                  >
                </v-btn>
                <v-btn
                  :disabled="sinValidStatus !== SINStatusEnum.VALID"
                  variant="plain"
                  color="primary"
                  class="label-bold"
                  @click="emitCancel(item.id)"
                  ><span class="label-bold">Cancel</span>
                  <v-tooltip activator="parent" location="start"
                    >Click To Cancel this Application</v-tooltip
                  >
                </v-btn>
              </span>
            </span>
            <span v-if="enableViewApplication">
              <v-btn
                variant="outlined"
                @click="$emit('goToApplication', item.id)"
                >View</v-btn
              >
            </span>
          </template>
        </v-data-table-server>
      </toggle-content>
    </content-group>
  </body-header-container>
</template>

<script lang="ts">
import { onMounted, ref, computed, defineComponent } from "vue";
import {
  ApplicationStatus,
  DEFAULT_PAGE_LIMIT,
  DataTableSortOrder,
  StudentApplicationFields,
  SINStatusEnum,
  StudentApplicationsSummaryHeaders,
  ITEMS_PER_PAGE,
  DataTableOptions,
  PaginationOptions,
} from "@/types";
import { ApplicationService } from "@/services/ApplicationService";
import { useFormatters } from "@/composables";
import StatusChipApplication from "@/components/generic/StatusChipApplication.vue";
import { useStore } from "vuex";
import {
  ApplicationSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import { useDisplay } from "vuetify";

export default defineComponent({
  components: { StatusChipApplication },
  emits: ["editApplicationAction", "openConfirmCancel", "goToApplication"],
  props: {
    studentId: {
      type: Number,
      required: false,
    },
    enableViewApplication: {
      type: Boolean,
      required: false,
      default: false,
    },
    manageApplication: {
      type: Boolean,
      required: false,
      default: false,
    },
    enableViewApplicationOnName: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props, { emit }) {
    const loading = ref(false);
    const { mobile: isMobile } = useDisplay();
    const applicationsAndCount = ref(
      {} as PaginatedResultsAPIOutDTO<ApplicationSummaryAPIOutDTO>,
    );
    const { dateOnlyLongString } = useFormatters();
    const store = useStore();

    const DEFAULT_SORT_FIELD = StudentApplicationFields.Status;
    const currentPagination = ref<PaginationOptions>({
      page: 1,
      pageLimit: DEFAULT_PAGE_LIMIT,
      sortField: DEFAULT_SORT_FIELD,
      sortOrder: DataTableSortOrder.DESC,
    });

    const sinValidStatus = computed(
      () => store.state.student.sinValidStatus.sinStatus,
    );

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

    const reloadApplications = async () => {
      await getStudentApplications();
    };

    onMounted(reloadApplications);

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
        currentPagination.value.sortOrder = DataTableSortOrder.DESC;
      }
      await getStudentApplications();
    };

    const emitCancel = (applicationId: number) => {
      emit("openConfirmCancel", applicationId, () => reloadApplications());
    };

    return {
      dateOnlyLongString,
      ApplicationStatus,
      applicationsAndCount,
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      loading,
      StudentApplicationFields,
      reloadApplications,
      SINStatusEnum,
      sinValidStatus,
      emitCancel,
      StudentApplicationsSummaryHeaders,
      isMobile,
      paginationAndSortEvent,
    };
  },
});
</script>
