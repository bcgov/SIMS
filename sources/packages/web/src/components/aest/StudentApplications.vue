<template>
  <!-- This component is shared between ministry and student users -->
  <body-header
    title="Applications"
    class="m-1"
    :recordsCount="applicationsAndCount.count"
  ></body-header>
  <content-group>
    <DataTable
      :value="applicationsAndCount.results"
      :lazy="true"
      :paginator="true"
      :rows="DEFAULT_PAGE_LIMIT"
      :rowsPerPageOptions="PAGINATION_LIST"
      :totalRecords="applicationsAndCount.count"
      @page="paginationAndSortEvent($event)"
      @sort="paginationAndSortEvent($event)"
      :loading="loading"
    >
      <template #empty>
        <p class="text-center font-weight-bold">No records found.</p>
      </template>
      <Column
        :field="StudentApplicationFields.ApplicationNumber"
        sortable="true"
        header="Application #"
      >
      </Column>
      <Column :field="StudentApplicationFields.ApplicationName" header="Name">
        <template #body="slotProps">
          <v-btn
            v-if="clientType === ClientIdType.Student"
            variant="plain"
            @click="$emit('goToApplication', slotProps.data.id)"
            color="primary"
            >{{ slotProps.data.applicationName }}
            <v-tooltip activator="parent" location="start"
              >Click To View this Application</v-tooltip
            >
          </v-btn>

          <span v-if="clientType === ClientIdType.AEST"
            >{{ slotProps.data.applicationName }}
          </span>
        </template>
      </Column>
      <Column
        :field="StudentApplicationFields.Submitted"
        header="Submitted"
      ></Column>
      <Column
        :field="StudentApplicationFields.StudyPeriod"
        header="Study Period"
      >
        <template #body="slotProps">
          <span>
            {{ dateString(slotProps.data.studyStartPeriod) }} -
            {{ dateString(slotProps.data.studyEndPeriod) }}
          </span>
        </template></Column
      >
      <Column
        :field="StudentApplicationFields.Status"
        header="Status"
        sortable="true"
      >
        <template #body="slotProps">
          <status-chip-application :status="slotProps.data.status" />
        </template>
      </Column>
      <Column :field="StudentApplicationFields.Actions" header="Actions">
        <template #body="slotProps">
          <span v-if="clientType === ClientIdType.Student">
            <span
              v-if="
                !(
                  slotProps.data.status === ApplicationStatus.cancelled ||
                  slotProps.data.status === ApplicationStatus.completed
                )
              "
            >
              <v-btn
                :disabled="sinValidStatus !== SINStatusEnum.VALID"
                variant="plain"
                color="primary"
                class="label-bold"
                @click="
                  $emit(
                    'editApplicationAction',
                    slotProps.data.status,
                    slotProps.data.id,
                  )
                "
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
                @click="$emit('openConfirmCancel', slotProps.data.id)"
                ><span class="label-bold">Cancel</span>
                <v-tooltip activator="parent" location="start"
                  >Click To Cancel this Application</v-tooltip
                >
              </v-btn>
            </span>
          </span>
          <span v-if="clientType === ClientIdType.AEST">
            <v-btn
              variant="outlined"
              @click="$emit('goToApplication', slotProps.data.id)"
              >View</v-btn
            >
          </span>
        </template>
      </Column>
    </DataTable>
  </content-group>
</template>

<script lang="ts">
import { onMounted, ref, computed, watch } from "vue";
import {
  ApplicationStatus,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  DataTableSortOrder,
  PAGINATION_LIST,
  StudentApplicationFields,
  ClientIdType,
  SINStatusEnum,
} from "@/types";
import { ApplicationService } from "@/services/ApplicationService";
import { useFormatters } from "@/composables";
import StatusChipApplication from "@/components/generic/StatusChipApplication.vue";
import { useStore } from "vuex";
import { AuthService } from "@/services/AuthService";
import {
  ApplicationSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";

export default {
  components: { StatusChipApplication },
  emits: ["editApplicationAction", "openConfirmCancel", "goToApplication"],
  props: {
    studentId: {
      type: Number,
      required: false,
    },
    reloadData: {
      type: Boolean,
      default: false,
    },
  },
  setup(props: any) {
    const loading = ref(false);
    const applicationsAndCount = ref(
      {} as PaginatedResultsAPIOutDTO<ApplicationSummaryAPIOutDTO>,
    );
    const defaultSortOrder = -1;
    const currentPage = ref();
    const currentPageLimit = ref();
    const { dateString } = useFormatters();
    const store = useStore();

    const clientType = computed(() => AuthService.shared.authClientType);

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

    const reloadApplication = async () => {
      await getStudentApplications();
    };

    onMounted(async () => {
      reloadApplication();
    });

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

    watch(
      () => props.reloadData,
      () => {
        reloadApplication();
      },
    );

    return {
      dateString,
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
      ClientIdType,
      reloadApplication,
      SINStatusEnum,
      sinValidStatus,
      clientType,
    };
  },
};
</script>
