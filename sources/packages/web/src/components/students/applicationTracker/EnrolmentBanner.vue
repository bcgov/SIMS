<template>
  <application-status-tracker-banner
    :label="enrolmentBannerDetails.bannerLabel"
    :icon="enrolmentBannerDetails.bannerIcon"
    :icon-color="enrolmentBannerDetails.iconColor"
    :background-color="enrolmentBannerDetails.backgroundColor"
  >
    <template #content
      ><span class="font-bold" v-if="enrolmentBannerDetails.contentHeader">{{
        enrolmentBannerDetails.contentHeader
      }}</span>
      {{ enrolmentBannerDetails.content }}</template
    >
  </application-status-tracker-banner>
</template>
<script lang="ts">
import ApplicationStatusTrackerBanner from "@/components/students/applicationTracker/generic/ApplicationStatusTrackerBanner.vue";
import { COEStatus } from "@/types";
import { EnrolmentBannerModel } from "@/components/students/applicationTracker/EnrolmentBanner.models";
import { defineComponent, PropType, computed } from "vue";

export default defineComponent({
  components: {
    ApplicationStatusTrackerBanner,
  },
  props: {
    coeStatus: {
      type: String as PropType<COEStatus>,
      required: true,
    },
    coeDenialReason: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const enrolmentBannerDetails = computed<EnrolmentBannerModel>(() => {
      switch (props.coeStatus) {
        case COEStatus.completed:
          return {
            bannerLabel:
              "Your enrolment has been confirmed by your institution",
            bannerIcon: "fa:fas fa-check-circle",
            iconColor: "success",
            content:
              "Your institution will check your enrolment closer to your study start date. Please contact the Financial Aid Officer from your institution if you require more information.",
            backgroundColor: "success-bg",
          };
        case COEStatus.declined:
          return {
            bannerLabel: "Your institution declined your enrolment status",
            bannerIcon: "fa:fas fa-exclamation-circle",
            iconColor: "danger",
            content: `${props.coeDenialReason}. Please note any scheduled payment(s) will be cancelled. Contact the Financial Aid Officer from your school if you require more information.`,
            contentHeader: "Reason from your institution:",
            backgroundColor: "error-bg",
          };
        default:
          return {
            bannerLabel: "Waiting for your confirmation of enrolment",
            bannerIcon: "fa:fas fa-clock",
            iconColor: "secondary",
            content:
              "Your institution will check your enrolment closer to your study start date. Please contact the Financial Aid Officer from your institution if you require more information.",
          };
      }
    });
    return {
      enrolmentBannerDetails,
    };
  },
});
</script>
