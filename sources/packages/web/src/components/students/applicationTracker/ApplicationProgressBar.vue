<template>
  <template v-if="applicationStatus !== ApplicationStatus.cancelled">
    <body-header title="Track your application" />
    <v-slider
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
      class="application-slider"
    >
      <template #tick-label="{ tick, index }">
        <span
          v-if="index === trackerApplicationStatus"
          class="label-bold default-color"
          >{{ tick.label }}
          <v-icon
            v-if="hasDeclinedCard"
            icon="fa:fas fa-exclamation-circle"
            :size="20"
            color="danger"
            class="pl-4"
        /></span>
        <span class="label-value default-color" v-else>{{ tick.label }} </span>
      </template>
    </v-slider>

    <draft
      @editApplication="$emit('editApplication')"
      v-if="applicationStatus === ApplicationStatus.draft"
    />
    <!-- The below components are checked with applicationStatusTracker[trackerApplicationStatus], so that in future if we need to see the previous, it can be easily attained just by removing readonly param from the v-slider or by adding a simple logic. -->
    <submitted
      v-if="
        trackerApplicationStatus !== undefined &&
        applicationStatusTracker[trackerApplicationStatus] ===
          ApplicationStatus.submitted
      "
    />
    <in-progress
      v-if="
        trackerApplicationStatus !== undefined &&
        applicationStatusTracker[trackerApplicationStatus] ===
          ApplicationStatus.inProgress
      "
      :applicationId="applicationId"
      @declinedEvent="declinedEvent"
    />
  </template>
  <cancelled v-else :applicationId="applicationId" />
</template>
<script lang="ts">
import { ApplicationStatus } from "@/types";
import { PropType, ref, defineComponent, computed } from "vue";
import Draft from "@/components/students/applicationTracker/Draft.vue";
import Submitted from "@/components/students/applicationTracker/Submitted.vue";
import InProgress from "@/components/students/applicationTracker/InProgress.vue";
import Cancelled from "@/components/students/applicationTracker/Cancelled.vue";

export default defineComponent({
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
    applicationStatus: {
      type: Object as PropType<ApplicationStatus>,
      required: true,
    },
  },
  setup(props) {
    const hasDeclinedCard = ref(false);
    const applicationStatusTracker = ref<Record<number, ApplicationStatus>>({
      0: ApplicationStatus.submitted,
      1: ApplicationStatus.inProgress,
      2: ApplicationStatus.assessment,
      3: ApplicationStatus.enrollment,
      4: ApplicationStatus.completed,
    });
    // trackFillColor will vary when more status are added.
    const trackFillColor = ref("warning");

    const applicationStatusOrder = (status: ApplicationStatus) => {
      const [key] =
        Object.entries(applicationStatusTracker.value).find(
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
      props.applicationStatus === ApplicationStatus.draft
        ? "default"
        : "warning",
    );

    const thumbSize = computed(() =>
      // thumbSize is 0 for all the status except draft and submitted.
      [ApplicationStatus.draft, ApplicationStatus.submitted].includes(
        props.applicationStatus,
      )
        ? 20
        : 0,
    );

    // Emit this function whenever there is a declined card (i.e whenever
    // exclamation icon needs to be shown). eg, Inprogress denial cards.
    const declinedEvent = () => {
      hasDeclinedCard.value = true;
      trackFillColor.value = "error";
    };

    return {
      applicationStatusTracker,
      trackerApplicationStatus,
      disabled,
      trackFillColor,
      thumbColor,
      thumbSize,
      ApplicationStatus,
      hasDeclinedCard,
      declinedEvent,
    };
  },
});
</script>
