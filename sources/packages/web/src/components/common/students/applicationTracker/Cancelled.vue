<template>
  <application-status-tracker-banner
    label="Your application was cancelled"
    icon="fa:fas fa-exclamation-circle"
    icon-color="danger"
    background-color="error-bg"
    ><template #content
      >Your application was cancelled on
      {{ dateOnlyLongString(cancelledDate) }}. However you can still view your
      application by clicking on the "Application actions" button. If you did
      not cancel your application, it means that your application has been
      cancelled due to changes in the study period made by your institution.
      Please contact the Financial Aid Officer from your institution if you
      require more information about the change. You'll need to submit a new
      application with the updated study period information to proceed.
    </template>
  </application-status-tracker-banner>
</template>
<script lang="ts">
import ApplicationStatusTrackerBanner from "@/components/common/students/applicationTracker/generic/ApplicationStatusTrackerBanner.vue";
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
      type: Date,
      required: true,
    },
  },
  setup() {
    const { dateOnlyLongString } = useFormatters();

    return { dateOnlyLongString };
  },
});
</script>
