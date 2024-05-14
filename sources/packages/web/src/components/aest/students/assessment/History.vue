<template>
  <v-card>
    <v-container>
      <body-header
        title="History"
        class="m-1"
        subTitle="A history of applications"
        :recordsCount="assessmentHistory.length"
      >
      </body-header>
      <content-group class="mt-4">
        <toggle-content
          :toggled="!assessmentHistory.length"
          message="No assessments found."
        >
          <DataTable
            :value="assessmentHistory"
            :paginator="true"
            :rows="DEFAULT_PAGE_LIMIT"
            :rowsPerPageOptions="PAGINATION_LIST"
            :totalRecords="assessmentHistory.length"
          >
            <template #empty>
              <p class="text-center font-weight-bold">No records found.</p>
            </template>
            <Column
              field="submittedDate"
              header="Submitted date"
              :sortable="true"
              ><template #body="slotProps">{{
                dateOnlyLongString(slotProps.data.submittedDate)
              }}</template></Column
            ><Column field="triggerType" header="Type" :sortable="true"></Column
            ><Column header="Request form">
              <template #body="{ data }">
                <template v-if="canShowViewRequest(data)">
                  <v-btn
                    @click="viewRequest(data)"
                    color="primary"
                    variant="text"
                    class="text-decoration-underline"
                    prepend-icon="fa:far fa-file-alt"
                  >
                    {{ getViewRequestLabel(data) }}</v-btn
                  >
                </template>
              </template></Column
            ><Column field="status" header="Status" :sortable="true"
              ><template #body="slotProps"
                ><status-chip-assessment-history
                  :status="slotProps.data.status" /></template></Column
            ><Column
              field="assessmentDate"
              header="Assessment date"
              :sortable="true"
              ><template #body="slotProps">
                <span v-if="slotProps.data.assessmentDate">{{
                  dateOnlyLongString(slotProps.data.assessmentDate)
                }}</span
                ><span v-else>-</span></template
              ></Column
            ><Column header="Assessment">
              <template #body="{ data }">
                <v-btn
                  v-if="!data.hasUnsuccessfulWeeks"
                  @click="$emit('viewAssessment', data.assessmentId)"
                  color="primary"
                >
                  View assessment</v-btn
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
import {
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  AssessmentTriggerType,
} from "@/types";
import { ref, onMounted, PropType, defineComponent } from "vue";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import { useFormatters } from "@/composables";
import StatusChipAssessmentHistory from "@/components/generic/StatusChipAssessmentHistory.vue";
import { AssessmentHistorySummaryAPIOutDTO } from "@/services/http/dto/Assessment.dto";

export default defineComponent({
  emits: [
    "viewStudentAppeal",
    "viewStudentApplicationOfferingChange",
    "viewScholasticStandingChange",
    "viewApplicationException",
    "viewAssessment",
    "viewOfferingRequest",
  ],
  components: {
    StatusChipAssessmentHistory,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
    // Assessment trigger types for which request form is available to view.
    viewRequestTypes: {
      type: Array as PropType<AssessmentTriggerType[]>,
      required: true,
    },
    studentId: {
      type: Number,
      required: false,
    },
  },
  setup(props, context) {
    const { dateOnlyLongString } = useFormatters();
    const assessmentHistory = ref([] as AssessmentHistorySummaryAPIOutDTO[]);
    onMounted(async () => {
      assessmentHistory.value =
        await StudentAssessmentsService.shared.getAssessmentHistory(
          props.applicationId,
          props.studentId,
        );
    });

    const viewRequest = (data: AssessmentHistorySummaryAPIOutDTO) => {
      switch (data.triggerType) {
        case AssessmentTriggerType.StudentAppeal:
          context.emit("viewStudentAppeal", data.studentAppealId);
          break;
        case AssessmentTriggerType.ApplicationOfferingChange:
          context.emit(
            "viewStudentApplicationOfferingChange",
            data.applicationOfferingChangeRequestId,
          );
          break;
        case AssessmentTriggerType.ScholasticStandingChange:
          context.emit(
            "viewScholasticStandingChange",
            data.studentScholasticStandingId,
          );
          break;
        case AssessmentTriggerType.OfferingChange:
          context.emit("viewOfferingRequest", data.offeringId, data.programId);
          break;
        case AssessmentTriggerType.OriginalAssessment:
          if (data.applicationExceptionId) {
            context.emit(
              "viewApplicationException",
              data.applicationExceptionId,
            );
          }
          break;
      }
    };

    // Decides to show the request form for all possible assessment trigger types.
    const canShowViewRequest = (
      data: AssessmentHistorySummaryAPIOutDTO,
    ): boolean => {
      let showRequestForm = false;
      if (props.viewRequestTypes.includes(data.triggerType)) {
        showRequestForm = true;
      }
      if (data.triggerType === AssessmentTriggerType.OriginalAssessment) {
        return showRequestForm && !!data.applicationExceptionId;
      }
      return showRequestForm;
    };

    const getViewRequestLabel = (
      data: AssessmentHistorySummaryAPIOutDTO,
    ): string => {
      if (data.triggerType === AssessmentTriggerType.OriginalAssessment) {
        return "View exception";
      }
      return "View request";
    };

    return {
      DEFAULT_PAGE_LIMIT,
      PAGINATION_LIST,
      assessmentHistory,
      dateOnlyLongString,
      viewRequest,
      canShowViewRequest,
      getViewRequestLabel,
    };
  },
});
</script>
