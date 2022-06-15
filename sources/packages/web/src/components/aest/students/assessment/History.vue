<template>
  <v-container>
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
          <toggle-content :toggled="!assessmentHistory.length">
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
                sortable="true"
                ><template #body="slotProps">{{
                  dateOnlyLongString(slotProps.data.submittedDate)
                }}</template></Column
              ><Column
                field="triggerType"
                header="Type"
                sortable="true"
              ></Column
              ><Column header="Request form">
                <template #body="{ data }">
                  <template v-if="canShowViewRequest(data)">
                    <v-btn
                      @click="viewRequest(data)"
                      color="primary"
                      variant="text"
                      class="text-decoration-underline"
                    >
                      <font-awesome-icon
                        :icon="['far', 'file-alt']"
                        class="mr-2"
                      />
                      {{ getViewRequestLabel(data) }}</v-btn
                    >
                  </template>
                </template></Column
              ><Column field="status" header="Status" sortable="true"
                ><template #body="slotProps"
                  ><status-chip-assessment-history
                    :status="slotProps.data.status" /></template></Column
              ><Column
                field="assessmentDate"
                header="Assessment date"
                sortable="true"
                ><template #body="slotProps">
                  <span v-if="slotProps.data.assessmentDate">{{
                    dateOnlyLongString(slotProps.data.assessmentDate)
                  }}</span
                  ><span v-else>-</span></template
                ></Column
              ><Column header="Assessment">
                <template #body="{ data }">
                  <v-btn
                    v-if="!data.isUnsuccessfulWeek"
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
  </v-container>
</template>
<script lang="ts">
import {
  DEFAULT_PAGE_LIMIT,
  PAGINATION_LIST,
  AssessmentTriggerType,
} from "@/types";
import { ref, onMounted, SetupContext } from "vue";
import { StudentAssessmentsService } from "@/services/StudentAssessmentsService";
import { useFormatters } from "@/composables";
import StatusChipAssessmentHistory from "@/components/generic/StatusChipAssessmentHistory.vue";
import { AssessmentHistorySummaryAPIOutDTO } from "@/services/http/dto/Assessment.dto";

export default {
  emits: [
    "viewStudentAppeal",
    "viewScholasticStandingChange",
    "viewApplicationException",
    "viewAssessment",
  ],
  components: {
    StatusChipAssessmentHistory,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any, context: SetupContext) {
    const { dateOnlyLongString } = useFormatters();
    const assessmentHistory = ref([] as AssessmentHistorySummaryAPIOutDTO[]);
    onMounted(async () => {
      assessmentHistory.value =
        await StudentAssessmentsService.shared.getAssessmentHistory(
          props.applicationId,
        );
    });

    const viewRequest = (data: AssessmentHistorySummaryAPIOutDTO) => {
      switch (data.triggerType) {
        case AssessmentTriggerType.StudentAppeal:
          context.emit("viewStudentAppeal", data.studentAppealId);
          break;
        case AssessmentTriggerType.ScholasticStandingChange:
          context.emit(
            "viewScholasticStandingChange",
            data.studentScholasticStandingId,
          );
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

    const canShowViewRequest = (
      data: AssessmentHistorySummaryAPIOutDTO,
    ): boolean => {
      switch (data.triggerType) {
        case AssessmentTriggerType.StudentAppeal:
        case AssessmentTriggerType.ScholasticStandingChange:
          return true;
        case AssessmentTriggerType.OriginalAssessment:
          return !!data.applicationExceptionId;
        default:
          return false;
      }
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
};
</script>
