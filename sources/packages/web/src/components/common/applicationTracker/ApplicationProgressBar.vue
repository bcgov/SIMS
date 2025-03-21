<template>
  <v-card class="p-4">
    <template
      v-if="
        applicationProgressDetails.applicationStatus !==
        ApplicationStatus.Cancelled
      "
    >
      <body-header title="Track your application" />
      <stepper-progress-bar
        :progressBarValue="trackerApplicationStatus"
        :progressStepLabels="applicationTrackerLabels"
        :progressBarColor="trackFillColor"
        :initialStepSize="thumbSize"
        :disabled="disabled"
        :progressLabelIcon="statusIconDetails.statusIcon"
        :progressLabelIconColor="statusIconDetails.statusType"
      />
      <draft
        :are-application-actions-allowed="areApplicationActionsAllowed"
        @editApplication="$emit('editApplication')"
        v-if="
          applicationProgressDetails.applicationStatus ===
          ApplicationStatus.Draft
        "
      />
      <!-- The below components are checked with applicationStatusTracker[trackerApplicationStatus], so that in future if we need to see the previous, it can be easily attained just by removing readonly param from the v-slider or by adding a simple logic. -->
      <submitted
        v-else-if="
          applicationProgressDetails.applicationStatus ===
          ApplicationStatus.Submitted
        "
      />
      <in-progress
        v-else-if="
          applicationProgressDetails.applicationStatus ===
          ApplicationStatus.InProgress
        "
        :application-id="applicationId"
      />
      <assessment
        v-else-if="
          applicationProgressDetails.applicationStatus ===
          ApplicationStatus.Assessment
        "
        :assessmentTriggerType="
          applicationProgressDetails.assessmentTriggerType!
        "
        @goToNoticeOfAssessment="goToNoticeOfAssessment"
      />
      <enrolment
        v-else-if="
          applicationProgressDetails.applicationStatus ===
          ApplicationStatus.Enrolment
        "
        :applicationId="applicationId"
      />
      <completed
        :are-application-actions-allowed="areApplicationActionsAllowed"
        v-else-if="
          applicationProgressDetails.applicationStatus ===
          ApplicationStatus.Completed
        "
        :applicationId="applicationId"
      />
    </template>
    <cancelled
      v-else
      :application-id="applicationId"
      :cancelled-date="applicationProgressDetails.applicationStatusUpdatedOn"
    />
  </v-card>
</template>
<script lang="ts">
import {
  ApplicationStatus,
  ProgramInfoStatus,
  ApplicationExceptionStatus,
  COEStatus,
  StudentAppealStatus,
  StudentScholasticStandingChangeType,
  ApplicationOfferingChangeRequestStatus,
  AssessmentTriggerType,
} from "@/types";
import { ref, defineComponent, computed, watchEffect } from "vue";
import { ApplicationProgressDetailsAPIOutDTO } from "@/services/http/dto/Application.dto";
import { ApplicationService } from "@/services/ApplicationService";
import StepperProgressBar from "@/components/common/StepperProgressBar.vue";
import Draft from "@/components/common/applicationTracker/Draft.vue";
import Submitted from "@/components/common/applicationTracker/Submitted.vue";
import InProgress from "@/components/common/applicationTracker/InProgress.vue";
import Cancelled from "@/components/common/applicationTracker/Cancelled.vue";
import Assessment from "@/components/common/applicationTracker/Assessment.vue";
import Enrolment from "@/components/common/applicationTracker/Enrolment.vue";
import Completed from "@/components/common/applicationTracker/Completed.vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import router from "@/router";

interface StatusIconDetails {
  statusType: "success" | "warning" | "error";
  statusIcon: string;
}

const STATUS_ICON_SUCCESS: StatusIconDetails = {
  statusType: "success",
  statusIcon: "fa:fas fa-check-circle",
};

const STATUS_ICON_WARNING: StatusIconDetails = {
  statusType: "warning",
  statusIcon: "fa:fas fa-exclamation-triangle",
};

const STATUS_ICON_ERROR: StatusIconDetails = {
  statusType: "error",
  statusIcon: "fa:fas fa-exclamation-circle",
};

const INITIAL_THUMB_SIZE = 14;
const DEFAULT_THUMB_SIZE = 0;

export default defineComponent({
  emits: ["editApplication"],
  components: {
    StepperProgressBar,
    Draft,
    Submitted,
    InProgress,
    Cancelled,
    Assessment,
    Enrolment,
    Completed,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
    areApplicationActionsAllowed: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const applicationTrackerLabels = [
      ApplicationStatus.Submitted,
      ApplicationStatus.InProgress,
      ApplicationStatus.Assessment,
      ApplicationStatus.Enrolment,
      ApplicationStatus.Completed,
    ];
    const applicationProgressDetails = ref(
      {} as ApplicationProgressDetailsAPIOutDTO,
    );
    const statusIconDetails = ref({} as StatusIconDetails);
    const trackFillColor = computed<string>(() => {
      if (statusIconDetails.value.statusType === "error") {
        return "error";
      } else if (statusIconDetails.value.statusType === "success") {
        return "success";
      }
      return "warning";
    });

    // Adding watch effect instead of onMounted because
    // applicationId may not be not available on load.
    watchEffect(async () => {
      if (props.applicationId) {
        applicationProgressDetails.value =
          await ApplicationService.shared.getApplicationProgressDetails(
            props.applicationId,
          );

        if (
          applicationProgressDetails.value.scholasticStandingChangeType ===
            StudentScholasticStandingChangeType.StudentDidNotCompleteProgram ||
          applicationProgressDetails.value.pirStatus ===
            ProgramInfoStatus.declined ||
          applicationProgressDetails.value.exceptionStatus ===
            ApplicationExceptionStatus.Declined ||
          applicationProgressDetails.value.firstCOEStatus ===
            COEStatus.declined ||
          applicationProgressDetails.value.secondCOEStatus ===
            COEStatus.declined
        ) {
          // One of the requests or confirmations is declined.
          statusIconDetails.value = STATUS_ICON_ERROR;
        } else if (
          applicationProgressDetails.value.appealStatus ===
            StudentAppealStatus.Pending ||
          applicationProgressDetails.value
            .applicationOfferingChangeRequestStatus ===
            ApplicationOfferingChangeRequestStatus.InProgressWithSABC ||
          applicationProgressDetails.value
            .applicationOfferingChangeRequestStatus ===
            ApplicationOfferingChangeRequestStatus.InProgressWithStudent ||
          applicationProgressDetails.value.hasBlockFundingFeedbackError ||
          applicationProgressDetails.value.hasECertFailedValidations
        ) {
          // Application is completed but has warnings.
          statusIconDetails.value = STATUS_ICON_WARNING;
        } else if (
          // Application is completed.
          applicationProgressDetails.value.applicationStatus ===
          ApplicationStatus.Completed
        ) {
          statusIconDetails.value = STATUS_ICON_SUCCESS;
        }
      }
    });

    const trackerApplicationStatus = computed(() =>
      applicationTrackerLabels.findIndex(
        (status) =>
          status === applicationProgressDetails.value.applicationStatus,
      ),
    );

    const disabled = computed(
      () =>
        applicationProgressDetails.value.applicationStatus ===
        ApplicationStatus.Draft,
    );

    const thumbSize = computed(() =>
      // thumbSize is 0 for all the status except draft and submitted.
      [ApplicationStatus.Draft, ApplicationStatus.Submitted].includes(
        applicationProgressDetails.value.applicationStatus,
      )
        ? INITIAL_THUMB_SIZE
        : DEFAULT_THUMB_SIZE,
    );

    const goToNoticeOfAssessment = () => {
      router.push({
        name: StudentRoutesConst.NOTICE_OF_ASSESSMENT_VIEW,
        params: {
          applicationId: props.applicationId,
          assessmentId: applicationProgressDetails.value.currentAssessmentId,
        },
      });
    };

    return {
      AssessmentTriggerType,
      applicationTrackerLabels,
      trackerApplicationStatus,
      disabled,
      trackFillColor,
      thumbSize,
      ApplicationStatus,
      statusIconDetails,
      applicationProgressDetails,
      goToNoticeOfAssessment,
    };
  },
});
</script>
