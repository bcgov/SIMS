<!-- This component is student specific. -->
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
          :headers="StudentApplicationsExtendedSummaryHeaders"
          :items="applicationsAndCount.results"
          :items-per-page="DEFAULT_PAGE_LIMIT"
          :items-per-page-options="ITEMS_PER_PAGE"
          :items-length="applicationsAndCount.count"
          :loading="loading"
          :mobile="isMobile"
          @update:options="paginationAndSortEvent"
          show-expand
        >
          <template #[`item.applicationNumber`]="{ item }">
            {{ item.applicationNumber }}
          </template>
          <template #[`item.applicationName`]="{ item }">
            <v-btn
              variant="plain"
              @click="$emit('goToApplication', item.id)"
              color="primary"
              >{{ item.applicationName }}
              <v-tooltip activator="parent" location="start"
                >Click to view this application</v-tooltip
              >
            </v-btn>
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
            <v-btn
              variant="plain"
              color="primary"
              @click="$emit('goToApplication', item.id)"
              >View
              <v-tooltip activator="parent" location="start"
                >Click to view this application</v-tooltip
              >
            </v-btn>
            <v-btn
              v-if="canDisplayEdit(item)"
              :disabled="!hasSINValidStatus"
              variant="plain"
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
              :disabled="!hasSINValidStatus"
              variant="plain"
              color="primary"
              @click="$emit('editApplicationAction', item.status, item.id)"
              append-icon="mdi-pencil-outline"
              >Change Request
              <v-tooltip activator="parent" location="start"
                >Click to request a change in this application</v-tooltip
              >
            </v-btn>
            <v-btn
              v-if="canDisplayCancel(item)"
              :disabled="!hasSINValidStatus"
              variant="plain"
              color="primary"
              @click="emitCancel(item.id)"
              >Cancel
              <v-tooltip activator="parent" location="start"
                >Click to cancel this application</v-tooltip
              >
            </v-btn>
          </template>
          <!-- <template #[`item.history`]="{ item }">
            <v-select
              density="compact"
              :items="item.versions"
              item-value="id"
              label="Versions"
              style="min-width: 130px"
            >
              <template v-slot:item="{ item }">
                <v-list-item @click="$emit('goToApplication', item.raw.id)">
                  <v-list-item-title
                    >{{
                      getISODateHourMinuteString(item.raw.submittedDate)
                    }}
                    ({{ item.raw.applicationEditStatus }})</v-list-item-title
                  >
                </v-list-item>
              </template>
            </v-select>
          </template> -->
          <template
            v-slot:[`item.data-table-expand`]="{
              internalItem,
              isExpanded,
              toggleExpand,
            }"
          >
            <v-btn
              :append-icon="
                isExpanded(internalItem) ? 'mdi-chevron-up' : 'mdi-chevron-down'
              "
              text="Versions"
              variant="plain"
              color="primary"
              @click="toggleExpand(internalItem)"
            ></v-btn>
          </template>
          <template v-slot:expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="py-4">
                <content-group>
                  <v-table density="compact">
                    <thead>
                      <tr>
                        <th>Submitted</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="version in item.versions" :key="version.id">
                        <td>
                          {{
                            getISODateHourMinuteString(version.submittedDate)
                          }}
                        </td>
                        <td>{{ version.applicationEditStatus }}</td>
                        <td>View this application version</td>
                      </tr>
                    </tbody>
                  </v-table>
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
import { onMounted, ref, computed, defineComponent } from "vue";
import {
  ApplicationStatus,
  DEFAULT_PAGE_LIMIT,
  DataTableSortOrder,
  StudentApplicationFields,
  SINStatusEnum,
  StudentApplicationsExtendedSummaryHeaders,
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
  setup(_, { emit }) {
    const loading = ref(false);
    const { mobile: isMobile } = useDisplay();
    const applicationsAndCount = ref(
      {} as PaginatedResultsAPIOutDTO<ApplicationSummaryAPIOutDTO>,
    );

    const {
      dateOnlyLongString,
      getISODateHourMinuteString,
      emptyStringFiller,
    } = useFormatters();
    const store = useStore();

    const DEFAULT_SORT_FIELD = StudentApplicationFields.Status;
    const currentPagination = ref<PaginationOptions>({
      page: 1,
      pageLimit: DEFAULT_PAGE_LIMIT,
      sortField: DEFAULT_SORT_FIELD,
      sortOrder: DataTableSortOrder.DESC,
    });

    const hasSINValidStatus = computed(
      () =>
        store.state.student.sinValidStatus.sinStatus === SINStatusEnum.VALID,
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
        currentPagination.value.sortOrder = DataTableSortOrder.ASC;
      }
      await getStudentApplications();
    };

    const emitCancel = (applicationId: number) => {
      emit("openConfirmCancel", applicationId, () => reloadApplications());
    };

    const canDisplayEdit = (application: ApplicationSummaryAPIOutDTO) => {
      return (
        application.status !== ApplicationStatus.Cancelled &&
        application.status !== ApplicationStatus.Completed
      );
    };

    const canDisplayChangeRequest = (
      application: ApplicationSummaryAPIOutDTO,
    ) => {
      return (
        application.status !== ApplicationStatus.Cancelled &&
        application.status === ApplicationStatus.Completed &&
        application.isChangeRequestAllowed
      );
    };

    const canDisplayCancel = (application: ApplicationSummaryAPIOutDTO) => {
      return (
        application.status !== ApplicationStatus.Cancelled &&
        application.status !== ApplicationStatus.Completed
      );
    };

    return {
      dateOnlyLongString,
      getISODateHourMinuteString,
      emptyStringFiller,
      canDisplayEdit,
      canDisplayChangeRequest,
      canDisplayCancel,
      ApplicationStatus,
      applicationsAndCount,
      DEFAULT_PAGE_LIMIT,
      ITEMS_PER_PAGE,
      loading,
      StudentApplicationFields,
      hasSINValidStatus,
      emitCancel,
      StudentApplicationsExtendedSummaryHeaders,
      isMobile,
      paginationAndSortEvent,
    };
  },
});
</script>
