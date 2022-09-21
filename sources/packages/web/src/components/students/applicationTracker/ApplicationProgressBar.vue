<template>
  <body-header
    title="Track your application"
    v-if="applicationDetails.applicationStatus !== ApplicationStatus.cancelled"
  />
  {{ applicationDetails.applicationStatus }}=={{ trackerApplicationStatus }}--{{
    applicationStatusTracker[trackerApplicationStatus]
  }}
  <v-slider
    v-if="applicationDetails.applicationStatus !== ApplicationStatus.cancelled"
    v-model="trackerApplicationStatus"
    :ticks="applicationStatusTracker"
    :max="4"
    step="1"
    show-ticks="always"
    tick-size="0"
    track-color="readonly"
    :track-fill-color="trackFillColor"
    :thumb-size="thumbSize"
    :thumb-color="thumbColor"
    track-size="20"
    readonly
    :disabled="disabled"
    class="message-color"
  ></v-slider>
  <draft
    @editApplication="$emit('editApplication')"
    v-if="applicationDetails.applicationStatus === ApplicationStatus.draft"
  />
  <cancelled
    v-if="applicationDetails.applicationStatus === ApplicationStatus.cancelled"
  />
  <!-- The below components are checked with applicationStatusTracker[trackerApplicationStatus], so that in future if we need to see the previous, it can be easily attained just by removing readonly param from the v-slider or by adding a simple logic. -->
  <submitted
    v-if="
      applicationStatusTracker[trackerApplicationStatus] ===
      ApplicationStatus.submitted
    "
  />
  <in-progress
    v-if="
      applicationStatusTracker[trackerApplicationStatus] ===
      ApplicationStatus.inProgress
    "
  />
</template>
<script lang="ts">
import { ApplicationStatus, GetApplicationDataDto } from "@/types";
import { onMounted, ref } from "vue";
import { ApplicationService } from "@/services/ApplicationService";
import Draft from "@/components/students/applicationTracker/Draft.vue";
import Submitted from "@/components/students/applicationTracker/Submitted.vue";
import InProgress from "@/components/students/applicationTracker/InProgress.vue";
import Cancelled from "@/components/students/applicationTracker/Cancelled.vue";

export default {
  emits: ["editApplication"],
  components: {
    Draft,
    Submitted,
    InProgress,
    Cancelled,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const applicationStatusTracker = ref<Record<number, ApplicationStatus>>({
      0: ApplicationStatus.submitted,
      1: ApplicationStatus.inProgress,
      2: ApplicationStatus.assessment,
      3: ApplicationStatus.enrollment,
      4: ApplicationStatus.completed,
    });
    const trackerApplicationStatus = ref<number>();
    // todo: ann review GetApplicationDataDto
    const applicationDetails = ref({} as GetApplicationDataDto);
    const disabled = ref(false);
    // Todo: trackFillColor will vary when more status are added.
    const trackFillColor = ref("warning");
    const thumbColor = ref("warning");
    const thumbSize = ref(0);
    const applicationStatusOrder = (status: ApplicationStatus) => {
      const key = Object.keys(applicationStatusTracker.value).find(
        (key) => applicationStatusTracker.value[key] === status,
      );
      if (key !== undefined) return +key;
    };

    const getApplicationDetails = async () => {
      // todo: ann check this function
      applicationDetails.value =
        await ApplicationService.shared.getApplicationData(props.applicationId);
    };

    onMounted(async () => {
      await getApplicationDetails();
      if (
        applicationDetails.value.applicationStatus === ApplicationStatus.draft
      ) {
        disabled.value = true;
        thumbColor.value = "default";
        thumbSize.value = 20;
        return;
      }
      trackerApplicationStatus.value = applicationStatusOrder(
        applicationDetails.value.applicationStatus,
      );
    });

    return {
      applicationStatusTracker,
      trackerApplicationStatus,
      applicationDetails,
      disabled,
      trackFillColor,
      thumbColor,
      thumbSize,
      ApplicationStatus,
    };
  },
};
</script>
