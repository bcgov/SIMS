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
        <v-data-table
          :headers="StudentApplicationsSummaryHeaders"
          :items="applicationsAndCount.results"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          :mobile="isMobile"
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
        </v-data-table>
      </toggle-content>
    </content-group>
  </body-header-container>
</template>

<script lang="ts">
import { onMounted, ref, computed, defineComponent } from "vue";
import {
  ApplicationStatus,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  DataTableSortOrder,
  PAGINATION_LIST,
  StudentApplicationFields,
  SINStatusEnum,
  StudentApplicationsSummaryHeaders,
  ITEMS_PER_PAGE,
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
    const defaultSortOrder = -1;
    const currentPage = ref();
    const currentPageLimit = ref();
    const { dateOnlyLongString } = useFormatters();
    const store = useStore();

    const sinValidStatus = computed(
      () => store.state.student.sinValidStatus.sinStatus,
    );

    /**
     * function to load applicationListAndCount respective to the client type
     * @param page page number, if nothing passed then DEFAULT_PAGE_NUMBER
     * @param pageCount page limit, if nothing passed then DEFAULT_PAGE_LIMIT
     * @param sortField sort field, if nothing passed then StudentApplicationFields.status
     * @param sortOrder sort oder, if nothing passed then DataTableSortOrder.ASC
     */
    const getStudentApplications = async (
      page = DEFAULT_PAGE_NUMBER,
      pageCount = DEFAULT_PAGE_LIMIT,
      sortField = StudentApplicationFields.Status,
      sortOrder = DataTableSortOrder.ASC,
    ) => {
      applicationsAndCount.value =
        await ApplicationService.shared.getStudentApplicationSummary(
          page,
          pageCount,
          sortField,
          sortOrder,
          props.studentId,
        );
    };

    const reloadApplications = async () => {
      await getStudentApplications();
    };

    onMounted(reloadApplications);

    // pagination sort event callback
    const paginationAndSortEvent = async (event: any) => {
      loading.value = true;
      currentPage.value = event?.page;
      currentPageLimit.value = event?.rows;
      await getStudentApplications(
        event.page,
        event.rows,
        event.sortField,
        event.sortOrder,
      );
      loading.value = false;
    };

    const emitCancel = (applicationId: number) => {
      emit("openConfirmCancel", applicationId, () => reloadApplications());
    };

    return {
      dateOnlyLongString,
      ApplicationStatus,
      applicationsAndCount,
      DEFAULT_PAGE_LIMIT,
      DEFAULT_PAGE_NUMBER,
      DataTableSortOrder,
      PAGINATION_LIST,
      paginationAndSortEvent,
      loading,
      defaultSortOrder,
      StudentApplicationFields,
      reloadApplications,
      SINStatusEnum,
      sinValidStatus,
      emitCancel,
      StudentApplicationsSummaryHeaders,
      ITEMS_PER_PAGE,
      isMobile,
    };
  },
});
</script>
