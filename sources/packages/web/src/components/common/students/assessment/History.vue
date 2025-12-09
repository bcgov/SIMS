<template>
  <v-card>
    <v-container>
      <body-header
        title="Completed changes"
        class="m-1"
        sub-title="Any events that resulted in a change to the students assessment."
        :records-count="assessmentHistory.length"
      >
      </body-header>
      <content-group class="mt-4">
        <toggle-content
          :toggled="!assessmentHistory.length"
          message="No assessments found."
        >
          <v-data-table
            :headers="CompletedChangesHeaders"
            :items="assessmentHistory"
            :items-per-page="DEFAULT_PAGE_LIMIT"
            :items-per-page-options="ITEMS_PER_PAGE"
            :mobile="isMobile"
          >
            <template #[`item.submittedDate`]="{ item }">
              {{ dateOnlyLongString(item.submittedDate) }}
            </template>
            <template #[`item.triggerType`]="{ item }">
              {{ item.triggerType }}
            </template>
            <template #[`item.requestForm`]="{ item }">
              <template v-if="canShowViewRequest(item)">
                <v-btn
                  @click="viewRequest(item)"
                  color="primary"
                  variant="text"
                  class="text-decoration-underline"
                  prepend-icon="fa:far fa-file-alt"
                >
                  {{ getViewRequestLabel(item) }}</v-btn
                >
              </template>
            </template>
            <template #[`item.status`]="{ item }">
              <status-chip-assessment-history :status="item.status" />
            </template>
            <template #[`item.assessmentDate`]="{ item }">
              {{
                emptyStringFiller(
                  getISODateHourMinuteString(item.assessmentDate),
                )
              }}
            </template>
            <template #[`item.assessment`]="{ item }">
              <v-btn
                v-if="!item.hasUnsuccessfulWeeks"
                @click="$emit('viewAssessment', item.assessmentId)"
                variant="outlined"
                color="primary"
              >
                View</v-btn
              >
            </template>
          </v-data-table>
        </toggle-content>
      </content-group>
    </v-container>
  </v-card>
</template>
<script lang="ts">
import {
  DEFAULT_PAGE_LIMIT,
  ITEMS_PER_PAGE,
  AssessmentTriggerType,
  CompletedChangesHeaders,
} from "@/types";
import { ref, PropType, defineComponent, watchEffect } from "vue";
import { useDisplay } from "vuetify";
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
      default: undefined,
    },
  },
  setup(props, context) {
    const {
      dateOnlyLongString,
      emptyStringFiller,
      getISODateHourMinuteString,
    } = useFormatters();
    const { mobile: isMobile } = useDisplay();

    const assessmentHistory = ref([] as AssessmentHistorySummaryAPIOutDTO[]);

    // Adding watch effect instead of onMounted because
    // applicationId may not be not available on load.
    watchEffect(async () => {
      if (props.applicationId) {
        assessmentHistory.value =
          await StudentAssessmentsService.shared.getAssessmentHistory(
            props.applicationId,
            props.studentId,
          );
      }
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
      ITEMS_PER_PAGE,
      assessmentHistory,
      dateOnlyLongString,
      getISODateHourMinuteString,
      viewRequest,
      canShowViewRequest,
      getViewRequestLabel,
      emptyStringFiller,
      CompletedChangesHeaders,
      isMobile,
    };
  },
});
</script>
