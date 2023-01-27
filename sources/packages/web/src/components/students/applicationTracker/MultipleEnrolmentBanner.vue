<template>
  <application-status-tracker-banner
    label="Waiting for your first confirmation of enrolment"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    content="Your institution will check your enrolment closer to your study start date. Please contact the Financial Aid Officer from your institution if you require more information."
    v-if="firstCOEStatus === COEStatus.required"
  />

  <application-status-tracker-banner
    label="Waiting for your second confirmation of enrolment"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    content="Your institution will check your enrolment closer to your study start date. Please contact the Financial Aid Officer from your institution if you require more information."
    v-if="secondCOEStatus === COEStatus.required"
  />

  <application-status-tracker-banner
    label="Your institution declined your enrolment status"
    icon="fa:fas fa-clock"
    icon-color="danger"
    v-if="firstCOEStatus === COEStatus.declined"
    background-color="error-bg"
  >
    <template #content
      ><span class="font-bold">Reason from your institution:</span> Our records
      indicate you are not registered, please re-submit the application after
      registration.</template
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
  },
  setup() {
    return {
      COEStatus,
    };
  },
});
</script>
