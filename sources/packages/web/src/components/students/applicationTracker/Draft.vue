<template>
  <application-status-tracker-banner />
</template>
<script lang="ts">
import ApplicationStatusTrackerBanner from "@/components/students/applicationTracker/generic/ApplicationStatusTrackerBanner.vue";
export default {
  components: {
    ApplicationStatusTrackerBanner,
  },
  props: {
    label: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
};
</script>
