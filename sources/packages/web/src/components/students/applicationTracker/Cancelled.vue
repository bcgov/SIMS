<template>
  <!-- todo: ann check with andrew if to display the program header when a draft application was canceled (as most of the info wont be available). -->
  <application-status-tracker-banner
    label="You've cancelled your application"
    icon="fa:fas fa-exclamation-circle"
    icon-color="danger"
    background-color="error_bg"
    ><template #content
      ><span
        >You cancelled your application on
        {{ dateOnlyLongString(applicationDetails?.statusUpdatedOn) }}. However
        you can still view your application by clicking on the “Application
        actions” button.</span
      >
    </template></application-status-tracker-banner
  >
</template>
<script lang="ts">
import ApplicationStatusTrackerBanner from "@/components/students/applicationTracker/generic/ApplicationStatusTrackerBanner.vue";
import { useFormatters } from "@/composables";
import { ApplicationService } from "@/services/ApplicationService";
import { CancelledApplicationDetailsAPIOutDTO } from "@/types";
import { defineComponent, onMounted, ref } from "vue";

export default defineComponent({
  components: {
    ApplicationStatusTrackerBanner,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const applicationDetails = ref<CancelledApplicationDetailsAPIOutDTO>();
    const { dateOnlyLongString } = useFormatters();

    const getApplicationCancelledDetails = async () => {
      applicationDetails.value =
        await ApplicationService.shared.getCancelledApplicationDetails(
          props.applicationId,
        );
    };

    onMounted(getApplicationCancelledDetails);

    return { applicationDetails, dateOnlyLongString };
  },
});
</script>
