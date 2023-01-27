<template>
  <v-card class="p-4">
    <template v-if="applicationStatus !== ApplicationStatus.cancelled">
      <body-header title="Track your application" />
      <progress-bar
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
        v-if="applicationStatus === ApplicationStatus.draft"
      />
      <!-- The below components are checked with applicationStatusTracker[trackerApplicationStatus], so that in future if we need to see the previous, it can be easily attained just by removing readonly param from the v-slider or by adding a simple logic. -->
      <submitted
        v-else-if="applicationStatus === ApplicationStatus.submitted"
      />
      <in-progress
        v-else-if="applicationStatus === ApplicationStatus.inProgress"
        :application-id="applicationId"
      />
      <assessment
        v-else-if="applicationStatus === ApplicationStatus.assessment"
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
} from "@/types";
import { PropType, ref, defineComponent, computed, onMounted } from "vue";
import { ApplicationProgressDetailsAPIOutDTO } from "@/services/http/dto/Application.dto";
import { ApplicationService } from "@/services/ApplicationService";
import ProgressBar from "@/components/common/ProgressBar.vue";
import Draft from "@/components/students/applicationTracker/Draft.vue";
import Submitted from "@/components/students/applicationTracker/Submitted.vue";
import InProgress from "@/components/students/applicationTracker/InProgress.vue";
import Cancelled from "@/components/students/applicationTracker/Cancelled.vue";
import Assessment from "@/components/students/applicationTracker/Assessment.vue";

interface ApplicationEndStatusIconDetails {
  endStatusType?: "success" | "error";
  endStatusIcon?: string;
}
export default defineComponent({
  emits: ["editApplication"],
  components: {
    ProgressBar,
    Draft,
    Submitted,
    InProgress,
    Cancelled,
    Assessment,
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
    const applicationTrackerLabels = ref<Record<number, ApplicationStatus>>({
      0: ApplicationStatus.submitted,
      1: ApplicationStatus.inProgress,
      2: ApplicationStatus.assessment,
      3: ApplicationStatus.enrollment,
      4: ApplicationStatus.completed,
    });
    const applicationProgressDetails = ref(
      {} as ApplicationProgressDetailsAPIOutDTO,
    );
    const applicationEndStatus = ref({} as ApplicationEndStatusIconDetails);
    const trackFillColor = computed(() => {
      if (props.applicationStatus === ApplicationStatus.completed) {
        return "success";
      }
      if (applicationEndStatus.value.endStatusType === "error") {
        return "error";
      }
      return "warning";
    });

    onMounted(async () => {
      applicationProgressDetails.value =
        await ApplicationService.shared.getApplicationProgressDetails(
          props.applicationId,
        );
      // Application is complete.
      if (
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
      }
      // One of the requests or confirmation is declined.
      else if (
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

    const applicationStatusOrder = (status: ApplicationStatus) => {
      const [key] =
        Object.entries(applicationTrackerLabels.value).find(
          ([, value]) => value === status,
        ) ?? [];

      if (key !== undefined) {
        return +key;
      }
    };

    const trackerApplicationStatus = computed(() =>
      applicationStatusOrder(props.applicationStatus),
    );

    const disabled = computed(() =>
      props.applicationStatus === ApplicationStatus.draft ? true : false,
    );

    const thumbColor = computed(() =>
      props.applicationStatus === ApplicationStatus.draft ? "black" : "warning",
    );

    const thumbSize = computed(() =>
      // thumbSize is 0 for all the status except draft and submitted.
      [ApplicationStatus.draft, ApplicationStatus.submitted].includes(
        props.applicationStatus,
      )
        ? 14
        : 0,
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
