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
        alt="A paper plane in the air. Illustration by Storyset."
        src="@/assets/images/paper_plane.svg"
    /></template>
  </application-status-tracker-banner>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import ApplicationStatusTrackerBanner from "@/components/common/students/applicationTracker/generic/ApplicationStatusTrackerBanner.vue";
export default defineComponent({
  components: {
    ApplicationStatusTrackerBanner,
  },
});
</script>
