<template>
  <application-status-tracker-banner
    label="You have a new assessment due to another application"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    background-color="success-bg"
  >
    <template #content>
      An application in this program has changed and due to limits within the
      program year, this application may have been affected. Please review the
      assessment for any changes.
    </template>
  </application-status-tracker-banner>
</template>
<script lang="ts">
import ApplicationStatusTrackerBanner from "@/components/students/applicationTracker/generic/ApplicationStatusTrackerBanner.vue";
import { defineComponent } from "vue";

export default defineComponent({
  components: {
    ApplicationStatusTrackerBanner,
  },
});
</script>
