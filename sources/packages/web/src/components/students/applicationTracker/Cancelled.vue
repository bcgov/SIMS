<template>
  <application-status-tracker-banner
    label="You’ve cancelled your application"
    icon="fa:fas fa-exclamation-circle"
    icon-color="danger"
    content="You cancelled your application on July 25 2022. However you can still view your application by clicking on the “Application actions” button."
    background-color="error_bg"
  />
</template>
<script lang="ts">
import ApplicationStatusTrackerBanner from "@/components/students/applicationTracker/generic/ApplicationStatusTrackerBanner.vue";
export default {
  components: {
    ApplicationStatusTrackerBanner,
  },
};
</script>
