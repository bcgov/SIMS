<template>
  <related-application-changed v-if="showRelatedApplicationChanged" />
  <application-status-tracker-banner
    label="Action required! Please accept your assessment"
    icon="fa:fas fa-exclamation-triangle"
    icon-color="warning"
    background-color="warning-bg"
    ><template #content
      >Your assessment is ready! You must view and accept your assessment. Start
      by clicking “View assessment” in the table below. Your application will
      move to the enrolment stage after you accept your assessment.
    </template>
  </application-status-tracker-banner>
</template>
<script lang="ts">
import ApplicationStatusTrackerBanner from "@/components/students/applicationTracker/generic/ApplicationStatusTrackerBanner.vue";
import RelatedApplicationChanged from "@/components/students/applicationTracker/RelatedApplicationChanged.vue";
import { defineComponent } from "vue";

export default defineComponent({
  components: {
    ApplicationStatusTrackerBanner,
    RelatedApplicationChanged,
  },
  props: {
    showRelatedApplicationChanged: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
});
</script>
