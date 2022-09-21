<template>
  <application-status-tracker-banner
    label="Your application has been submitted!"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    content="Keep up-to-date with your application by tracking it here."
  >
    <template #image>
      <v-img
        height="60"
        alt="You don't have any agreements yet."
        src="@/assets/images/paper_plane.svg"
    /></template>
  </application-status-tracker-banner>
</template>
<script lang="ts">
import ApplicationStatusTrackerBanner from "@/components/students/applicationTracker/generic/ApplicationStatusTrackerBanner.vue";
export default {
  components: {
    ApplicationStatusTrackerBanner,
  },
};
</script>
