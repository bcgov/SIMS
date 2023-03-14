<template>
  <v-card class="p-4">
    <template v-if="applicationStatus !== ApplicationStatus.Cancelled">
      <body-header title="Track your application" />
      <stepper-progress-bar
        :progressBarValue="trackerApplicationStatus"
        :progressStepLabels="applicationTrackerLabels"
        :progressBarColor="trackFillColor"
        :initialStepSize="thumbSize"
        :disabled="disabled"
        :progressLabelIcon="applicationEndStatus.endStatusIcon"
        :progressLabelIconColor="applicationEndStatus.endStatusType"
      />
      <draft
        @editApplication="$emit('editApplication')"
        v-if="applicationStatus === ApplicationStatus.Draft"
      />
      <!-- The below components are checked with applicationStatusTracker[trackerApplicationStatus], so that in future if we need to see the previous, it can be easily attained just by removing readonly param from the v-slider or by adding a simple logic. -->
      <submitted
        v-else-if="applicationStatus === ApplicationStatus.Submitted"
      />
      <in-progress
        v-else-if="applicationStatus === ApplicationStatus.InProgress"
        :application-id="applicationId"
      />
      <assessment
        v-else-if="applicationStatus === ApplicationStatus.Assessment"
      />
      <enrolment
        v-else-if="applicationStatus === ApplicationStatus.Enrolment"
        :applicationId="applicationId"
      />
      <completed
        v-else-if="applicationStatus === ApplicationStatus.Completed"
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
} from "@/types";
import { PropType, ref, defineComponent, computed, onMounted } from "vue";
import { ApplicationProgressDetailsAPIOutDTO } from "@/services/http/dto/Application.dto";
import { ApplicationService } from "@/services/ApplicationService";
import StepperProgressBar from "@/components/common/StepperProgressBar.vue";
import Draft from "@/components/students/applicationTracker/Draft.vue";
import Submitted from "@/components/students/applicationTracker/Submitted.vue";
import InProgress from "@/components/students/applicationTracker/InProgress.vue";
import Cancelled from "@/components/students/applicationTracker/Cancelled.vue";
import Assessment from "@/components/students/applicationTracker/Assessment.vue";
import Enrolment from "@/components/students/applicationTracker/Enrolment.vue";
import Completed from "@/components/students/applicationTracker/Completed.vue";

interface ApplicationEndStatusIconDetails {
  endStatusType?: "success" | "warning" | "error";
  endStatusIcon?: string;
}
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
    applicationStatus: {
      type: String as PropType<ApplicationStatus>,
      required: true,
    },
  },
  setup(props) {
    const hasDeclinedCard = ref(false);
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
    const applicationEndStatus = ref({} as ApplicationEndStatusIconDetails);
    const trackFillColor = computed(() => {
      if (applicationEndStatus.value.endStatusType === "error") {
        return "error";
      }
      if (
        props.applicationStatus === ApplicationStatus.Completed &&
        applicationProgressDetails.value.appealStatus !==
          StudentAppealStatus.Pending
      ) {
        return "success";
      }
      return "warning";
    });

    onMounted(async () => {
      applicationProgressDetails.value =
        await ApplicationService.shared.getApplicationProgressDetails(
          props.applicationId,
        );

      if (
        applicationProgressDetails.value.appealStatus ===
        StudentAppealStatus.Pending
      ) {
        // Application is complete but has warnings.
        applicationEndStatus.value = {
          endStatusType: "warning",
          endStatusIcon: "fa:fas fa-exclamation-triangle",
        };
      } else if (
        // Application is complete.
        applicationProgressDetails.value.firstCOEStatus ===
          COEStatus.completed &&
        (!applicationProgressDetails.value.secondCOEStatus ||
          applicationProgressDetails.value.secondCOEStatus ===
            COEStatus.completed)
      ) {
        applicationEndStatus.value = {
          endStatusType: "success",
          endStatusIcon: "fa:fas fa-check-circle",
        };
      } else if (
        // One of the requests or confirmations is declined.
        applicationProgressDetails.value.pirStatus ===
          ProgramInfoStatus.declined ||
        applicationProgressDetails.value.exceptionStatus ===
          ApplicationExceptionStatus.Declined ||
        applicationProgressDetails.value.firstCOEStatus ===
          COEStatus.declined ||
        applicationProgressDetails.value.secondCOEStatus === COEStatus.declined
      ) {
        applicationEndStatus.value = {
          endStatusType: "error",
          endStatusIcon: "fa:fas fa-exclamation-circle",
        };
      }
    });

    const trackerApplicationStatus = computed(() =>
      applicationTrackerLabels.findIndex(
        (status) => status === props.applicationStatus,
      ),
    );

    const disabled = computed(
      () => props.applicationStatus === ApplicationStatus.Draft,
    );

    const thumbColor = computed(() =>
      props.applicationStatus === ApplicationStatus.Draft ? "black" : "warning",
    );

    const thumbSize = computed(() =>
      // thumbSize is 0 for all the status except draft and submitted.
      [ApplicationStatus.Draft, ApplicationStatus.Submitted].includes(
        props.applicationStatus,
      )
        ? INITIAL_THUMB_SIZE
        : DEFAULT_THUMB_SIZE,
    );

    return {
      applicationTrackerLabels,
      trackerApplicationStatus,
      disabled,
      trackFillColor,
      thumbColor,
      thumbSize,
      ApplicationStatus,
      hasDeclinedCard,
      applicationEndStatus,
      applicationProgressDetails,
    };
  },
});
</script>
