<template>
  <v-card class="p-4">
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
            class="label-bold black-color"
            >{{ tick.label }}
            <v-icon
              v-if="applicationEndStatus.isApplicationInEndStatus"
              :icon="applicationEndStatus.endStatusIcon"
              :size="20"
              :color="applicationEndStatus.endStatusColor"
              class="pl-4"
          /></span>
          <span class="label-value black-color" v-else>{{ tick.label }} </span>
        </template>
      </v-slider>

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
import Draft from "@/components/students/applicationTracker/Draft.vue";
import Submitted from "@/components/students/applicationTracker/Submitted.vue";
import InProgress from "@/components/students/applicationTracker/InProgress.vue";
import Cancelled from "@/components/students/applicationTracker/Cancelled.vue";
import Assessment from "@/components/students/applicationTracker/Assessment.vue";

interface ApplicationEndStatusDetails {
  isApplicationInEndStatus: boolean;
  endStatusColor?: string;
  endStatusIcon?: string;
}
export default defineComponent({
  emits: ["editApplication"],
  components: {
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
    const applicationStatusTracker = ref<Record<number, ApplicationStatus>>({
      0: ApplicationStatus.submitted,
      1: ApplicationStatus.inProgress,
      2: ApplicationStatus.assessment,
      3: ApplicationStatus.enrollment,
      4: ApplicationStatus.completed,
    });
    const applicationProgressDetails = ref(
      {} as ApplicationProgressDetailsAPIOutDTO,
    );
    const applicationEndStatus = ref({} as ApplicationEndStatusDetails);
    // trackFillColor will vary when more status are added.
    const trackFillColor = ref();

    onMounted(async () => {
      trackFillColor.value =
        props.applicationStatus === ApplicationStatus.completed
          ? "success"
          : "warning";
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
        trackFillColor.value = "success";
        applicationEndStatus.value = {
          isApplicationInEndStatus: true,
          endStatusColor: "success",
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
        trackFillColor.value = "error";
        applicationEndStatus.value = {
          isApplicationInEndStatus: true,
          endStatusColor: "error",
          endStatusIcon: "fa:fas fa-exclamation-circle",
        };
      }
    });

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
      props.applicationStatus === ApplicationStatus.draft ? "black" : "warning",
    );

    const thumbSize = computed(() =>
      // thumbSize is 0 for all the status except draft and submitted.
      [ApplicationStatus.draft, ApplicationStatus.submitted].includes(
        props.applicationStatus,
      )
        ? 15
        : 0,
    );

    return {
      applicationStatusTracker,
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
