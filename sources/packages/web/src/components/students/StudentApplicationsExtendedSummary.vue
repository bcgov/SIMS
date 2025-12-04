<!-- This component is student specific. -->
<template>
  <body-header-container>
    <template #header>
      <body-header
        title="Applications"
        :records-count="applicationsAndCount.count"
      ></body-header>
    </template>
    <content-group>
      <toggle-content
        :toggled="!applicationsAndCount.count"
        message="No applications are currently available."
      >
        <v-data-table-server
          :headers="StudentApplicationsExtendedSummaryHeaders"
          :items="applicationsAndCount.results"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          :items-length="applicationsAndCount.count"
          :loading="loading"
          :mobile="isMobile"
          @update:options="paginationAndSortEvent"
          show-expand
          v-model:expanded="expandedItems"
        >
          <template #loading>
            <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
          </template>
          <template #[`item.applicationNumber`]="{ item }">
            {{ item.applicationNumber }}
          </template>
          <template #[`item.submitted`]="{ item }">
            {{
              emptyStringFiller(getISODateHourMinuteString(item.submittedDate))
            }}
          </template>
          <template #[`item.studyStartPeriod`]="{ item }">
            {{ dateOnlyLongString(item.studyStartPeriod) }} -
            {{ dateOnlyLongString(item.studyEndPeriod) }}
          </template>
          <template #[`item.status`]="{ item }">
            <status-chip-application :status="item.status" />
          </template>
          <template #[`item.actions`]="{ item }">
            <v-btn-group
              variant="text"
              :direction="isMobile ? 'vertical' : 'horizontal'"
              :rounded="false"
            >
              <v-btn color="primary" @click="$emit('goToApplication', item.id)"
                >View
                <v-tooltip activator="parent" location="start"
                  >Click to view this application</v-tooltip
                >
              </v-btn>
              <v-btn
                v-if="canDisplayEditOrCancel(item)"
                :disabled="!hasValidSIN || item.isArchived"
                color="primary"
                @click="$emit('editApplicationAction', item.status, item.id)"
                append-icon="mdi-pencil-outline"
                >Edit
                <v-tooltip activator="parent" location="start"
                  >Click to edit this application</v-tooltip
                >
              </v-btn>
              <v-btn
                v-if="canDisplayChangeRequest(item)"
                :disabled="!hasValidSIN || item.isArchived"
                color="primary"
                @click="
                  $emit(
                    'changeApplicationAction',
                    item.id,
                    item.isChangeRequestAllowedForPY,
                  )
                "
                append-icon="mdi-pencil-outline"
                >Change Request
                <v-tooltip activator="parent" location="start"
                  >Click to request a change in this application</v-tooltip
                >
              </v-btn>
              <v-btn
                v-if="canDisplaySubmitAppeal(item)"
                :disabled="!hasValidSIN || item.isArchived"
                color="primary"
                @click="$emit('submitAppeal', item.id)"
                append-icon="mdi-pencil-outline"
                >Appeal
                <v-tooltip activator="parent" location="start"
                  >Click to submit an appeal to this application</v-tooltip
                >
              </v-btn>
              <v-btn
                v-if="canDisplayEditOrCancel(item)"
                :disabled="!hasValidSIN || item.isArchived"
                color="primary"
                @click="emitCancel(item.id)"
                >Cancel
                <v-tooltip activator="parent" location="start"
                  >Click to cancel this application</v-tooltip
                >
              </v-btn>
            </v-btn-group>
          </template>
          <template
            #[`item.data-table-expand`]="{
              internalItem,
              isExpanded,
              toggleExpand,
            }"
          >
            <v-btn
              :append-icon="
                isExpanded(internalItem)
                  ? '$expanderCollapseIcon'
                  : '$expanderExpandIcon'
              "
              text="Versions"
              variant="text"
              color="primary"
              @click="
                versionsExpanderClick(internalItem.raw, () =>
                  toggleExpand(internalItem),
                )
              "
            ></v-btn>
          </template>
          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="py-4">
                <content-group>
                  <student-applications-version
                    :versions="item.versions"
                    :loading="item.loadingVersions"
                    @view-application-version="
                      $emit('viewApplicationVersion', $event)
                    "
                  />
                </content-group>
              </td>
            </tr>
          </template>
        </v-data-table-server>
      </toggle-content>
    </content-group>
  </body-header-container>
</template>

<script lang="ts">
import { onMounted, ref, defineComponent } from "vue";
import {
  ApplicationStatus,
  DEFAULT_PAGE_LIMIT,
  DataTableSortOrder,
  StudentApplicationFields,
  StudentApplicationsExtendedSummaryHeaders,
  ITEMS_PER_PAGE,
  DataTableOptions,
  PaginationOptions,
  OfferingIntensity,
  DEFAULT_DATATABLE_PAGE_NUMBER,
} from "@/types";
import { ApplicationService } from "@/services/ApplicationService";
import { useFormatters, useStudentStore } from "@/composables";
import StatusChipApplication from "@/components/generic/StatusChipApplication.vue";
import StudentApplicationsVersion from "@/components/students/StudentApplicationsVersion.vue";
import {
  ApplicationSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
  ApplicationVersionAPIOutDTO,
} from "@/services/http/dto";
import { useDisplay } from "vuetify";

interface ApplicationSummaryModel extends ApplicationSummaryAPIOutDTO {
  versions?: ApplicationVersionAPIOutDTO[];
  loadingVersions?: boolean;
}

export default defineComponent({
  components: { StatusChipApplication, StudentApplicationsVersion },
  emits: {
    editApplicationAction: (status: ApplicationStatus, applicationId: number) =>
      !!status && !!applicationId,
    changeApplicationAction: (
      applicationId: number,
      allowChangeRequest: boolean,
    ) => !!applicationId && !!allowChangeRequest,
    openConfirmCancel: (applicationId: number, callback: () => void) =>
      !!applicationId && !!callback,
    goToApplication: (applicationId: number) => !!applicationId,
    viewApplicationVersion: (applicationId: number) => !!applicationId,
    submitAppeal: (applicationId: number) => !!applicationId,
  },
  setup(_, { emit }) {
    const loading = ref(false);
    const { mobile: isMobile } = useDisplay();
    const expandedItems = ref([]);
    const applicationsAndCount = ref(
      {} as PaginatedResultsAPIOutDTO<ApplicationSummaryModel>,
    );

    const {
      dateOnlyLongString,
      getISODateHourMinuteString,
      emptyStringFiller,
    } = useFormatters();
    const { hasValidSIN } = useStudentStore();

    const DEFAULT_SORT_FIELD = StudentApplicationFields.Status;
    const currentPagination: PaginationOptions = {
      page: DEFAULT_DATATABLE_PAGE_NUMBER,
      pageLimit: DEFAULT_PAGE_LIMIT,
      sortField: DEFAULT_SORT_FIELD,
      sortOrder: DataTableSortOrder.ASC,
    };

    const getStudentApplications = async () => {
      try {
        loading.value = true;
        // Reset expanded items when fetching new data.
        expandedItems.value = [];
        applicationsAndCount.value =
          await ApplicationService.shared.getStudentApplicationSummary(
            currentPagination,
          );
      } finally {
        loading.value = false;
      }
    };

    onMounted(getStudentApplications);

    /**
     * Page/Sort event handler.
     * @param event The data table page/sort event.
     */
    const paginationAndSortEvent = async (event: DataTableOptions) => {
      currentPagination.page = event.page;
      currentPagination.pageLimit = event.itemsPerPage;
      if (event.sortBy.length) {
        const [sortBy] = event.sortBy;
        currentPagination.sortField = sortBy.key;
        currentPagination.sortOrder = sortBy.order;
      } else {
        // Sorting was removed, reset to default
        currentPagination.sortField = DEFAULT_SORT_FIELD;
        currentPagination.sortOrder = DataTableSortOrder.ASC;
      }
      await getStudentApplications();
    };

    const emitCancel = (applicationId: number) => {
      emit("openConfirmCancel", applicationId, () => getStudentApplications());
    };

    const versionsExpanderClick = async (
      application: ApplicationSummaryModel,
      toggleExpand: () => void,
    ) => {
      toggleExpand();
      if (application.versions) {
        // Application versions are not required to be fetched every time.
        // If they are already loaded there is no critical reason to fetch them again.
        return;
      }
      try {
        application.loadingVersions = true;
        const applications =
          await ApplicationService.shared.getApplicationOverallDetails(
            application.id,
          );
        application.versions = applications.previousVersions;
      } catch (error) {
        console.error(error);
      } finally {
        application.loadingVersions = false;
      }
    };

    const canDisplayEditOrCancel = (
      application: ApplicationSummaryAPIOutDTO,
    ) => {
      return (
        application.status !== ApplicationStatus.Cancelled &&
        application.status !== ApplicationStatus.Completed
      );
    };

    const canDisplayChangeRequest = (
      application: ApplicationSummaryAPIOutDTO,
    ) => {
      return application.status === ApplicationStatus.Completed;
    };

    /**
     * Only completed full-time applications can submit an appeal.
     * @param application application.
     */
    const canDisplaySubmitAppeal = (
      application: ApplicationSummaryAPIOutDTO,
    ) => {
      return (
        application.isChangeRequestAllowedForPY &&
        application.status === ApplicationStatus.Completed &&
        application.offeringIntensity === OfferingIntensity.fullTime
      );
    };

    return {
      dateOnlyLongString,
      getISODateHourMinuteString,
      emptyStringFiller,
      canDisplayEditOrCancel,
      canDisplayChangeRequest,
      canDisplaySubmitAppeal,
      ApplicationStatus,
      applicationsAndCount,
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      loading,
      StudentApplicationFields,
      hasValidSIN,
      emitCancel,
      StudentApplicationsExtendedSummaryHeaders,
      isMobile,
      paginationAndSortEvent,
      versionsExpanderClick,
      expandedItems,
    };
  },
});
</script>
