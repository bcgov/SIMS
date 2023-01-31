<template>
  <!-- first enrolment banners -->
  <application-status-tracker-banner
    v-if="firstCOEStatus === COEStatus.required"
    label="Waiting for your first confirmation of enrolment"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    content="Your institution will check your enrolment closer to your study start date. Please contact the Financial Aid Officer from your institution if you require more information."
  />

  <application-status-tracker-banner
    v-if="firstCOEStatus === COEStatus.completed"
    label="Your first enrolment has been confirmed by your institution"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    content="Your institution will check your enrolment closer to your study start date. Please contact the Financial Aid Officer from your institution if you require more information."
    background-color="success-bg"
  />

  <application-status-tracker-banner
    v-if="firstCOEStatus === COEStatus.declined"
    label="Your institution declined your enrolment status"
    icon="fa:fas fa-exclamation-circle"
    icon-color="danger"
    background-color="error-bg"
  >
    <template #content
      ><span class="font-bold">Reason from your institution:</span>
      {{ firstCOEDenialReason }}. Please note any scheduled payment(s) will be
      cancelled. Contact the Financial Aid Officer from your school if you
      require more information.</template
    >
  </application-status-tracker-banner>

  <!-- Second enrolment banners -->

  <application-status-tracker-banner
    v-if="secondCOEStatus === COEStatus.required"
    label="Waiting for your second confirmation of enrolment"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    content="Your institution will check your enrolment closer to your study start date. Please contact the Financial Aid Officer from your institution if you require more information."
  />

  <application-status-tracker-banner
    v-if="secondCOEStatus === COEStatus.completed"
    label="Your second enrolment has been confirmed by your institution"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    content="Your institution will check your enrolment closer to your study start date. Please contact the Financial Aid Officer from your institution if you require more information."
    background-color="success-bg"
  />

  <application-status-tracker-banner
    v-if="secondCOEStatus === COEStatus.declined"
    label="Your institution declined your second enrolment status"
    icon="fa:fas fa-exclamation-circle"
    icon-color="danger"
    background-color="error-bg"
  >
    <template #content
      ><span class="font-bold">Reason from your institution:</span>
      {{ secondCOEDenialReason }}. Please note any scheduled payment(s) will be
      cancelled. Contact the Financial Aid Officer from your school if you
      require more information.</template
    >
  </application-status-tracker-banner>
</template>
<script lang="ts">
import ApplicationStatusTrackerBanner from "@/components/students/applicationTracker/generic/ApplicationStatusTrackerBanner.vue";
import { COEStatus } from "@/types";
import { defineComponent, PropType } from "vue";

export default defineComponent({
  components: {
    ApplicationStatusTrackerBanner,
  },
  props: {
    firstCOEStatus: {
      type: String as PropType<COEStatus>,
      required: true,
    },
    secondCOEStatus: {
      type: String as PropType<COEStatus>,
      required: true,
    },
    firstCOEDenialReason: {
      type: String,
      required: true,
    },
    secondCOEDenialReason: {
      type: String,
      required: true,
    },
  },
  setup() {
    return {
      COEStatus,
    };
  },
});
</script>
