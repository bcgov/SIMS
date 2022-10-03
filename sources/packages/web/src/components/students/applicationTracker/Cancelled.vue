<template>
  <application-status-tracker-banner
    label="You've cancelled your application"
    icon="fa:fas fa-exclamation-circle"
    icon-color="danger"
    background-color="error-bg"
    ><template #content
      >You cancelled your application on
      {{ dateOnlyLongString(cancelledDate) }}. However you can still view your
      application by clicking on the “Application actions” button.
    </template>
  </application-status-tracker-banner>
</template>
<script lang="ts">
import ApplicationStatusTrackerBanner from "@/components/students/applicationTracker/generic/ApplicationStatusTrackerBanner.vue";
import { useFormatters } from "@/composables";
import { defineComponent } from "vue";

export default defineComponent({
  components: {
    ApplicationStatusTrackerBanner,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
    cancelledDate: {
      type: String,
      required: true,
    },
  },
  setup() {
    const { dateOnlyLongString } = useFormatters();

    return { dateOnlyLongString };
  },
});
</script>
