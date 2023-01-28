<template>
  <application-status-tracker-banner
    :label="firstEnrolmentLabel"
    :icon="firstEnrolmentBannerDetails.bannerIcon"
    :icon-color="firstEnrolmentBannerDetails.iconColor"
    :background-color="firstEnrolmentBannerDetails.backgroundColor"
  >
    <template #content
      ><span
        class="font-bold"
        v-if="firstEnrolmentBannerDetails.contentHeader"
        >{{ firstEnrolmentBannerDetails.contentHeader }}</span
      >
      {{ firstEnrolmentBannerDetails.content }}</template
    >
  </application-status-tracker-banner>

  <application-status-tracker-banner
    :label="secondEnrolmentLabel"
    :icon="secondEnrolmentBannerDetails.bannerIcon"
    :icon-color="secondEnrolmentBannerDetails.iconColor"
    :background-color="secondEnrolmentBannerDetails.backgroundColor"
  >
    <template #content
      ><span
        class="font-bold"
        v-if="secondEnrolmentBannerDetails.contentHeader"
        >{{ secondEnrolmentBannerDetails.contentHeader }}</span
      >
      {{ secondEnrolmentBannerDetails.content }}</template
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
    firstCOEStatus: {
      type: String as PropType<COEStatus>,
      required: true,
    },
    secondCOEStatus: {
      type: String as PropType<COEStatus>,
      required: true,
    },
    firstCOEDenialReason: {
      type: String,
      required: true,
    },
    secondCOEDenialReason: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const getBannerDetails = (
      coeStatus: COEStatus,
      coeDenialReason: string,
    ): EnrolmentBannerModel => {
      switch (coeStatus) {
        case COEStatus.completed:
          return {
            bannerIcon: "fa:fas fa-check-circle",
            iconColor: "success",
            content:
              "Your institution will check your enrolment closer to your study start date. Please contact the Financial Aid Officer from your institution if you require more information.",
            backgroundColor: "success-bg",
          };
        case COEStatus.declined:
          return {
            bannerIcon: "fa:fas fa-exclamation-circle",
            iconColor: "success",
            content: `${coeDenialReason}. Please note any scheduled payment(s) will be cancelled. Contact the Financial Aid Officer from your school if you require more information.`,
            contentHeader: "Reason from your institution:",
            backgroundColor: "error-bg",
          };
        default:
          return {
            bannerIcon: "fa:fas fa-clock",
            iconColor: "secondary",
            content:
              "Your institution will check your enrolment closer to your study start date. Please contact the Financial Aid Officer from your institution if you require more information.",
          };
      }
    };
    const firstEnrolmentBannerDetails = computed<EnrolmentBannerModel>(() => {
      return getBannerDetails(props.firstCOEStatus, props.firstCOEDenialReason);
    });
    const secondEnrolmentBannerDetails = computed<EnrolmentBannerModel>(() => {
      return getBannerDetails(
        props.secondCOEStatus,
        props.secondCOEDenialReason,
      );
    });
    const firstEnrolmentLabel = computed(() => {
      switch (props.firstCOEStatus) {
        case COEStatus.completed:
          return "Your first enrolment has been confirmed by your institution";
        case COEStatus.declined:
          return "Your institution declined your enrolment status";
        default:
          return "Waiting for your first confirmation of enrolment";
      }
    });

    const secondEnrolmentLabel = computed(() => {
      switch (props.firstCOEStatus) {
        case COEStatus.completed:
          return "Your second enrolment has been confirmed by your institution";
        case COEStatus.declined:
          return "Your institution declined your second enrolment status";
        default:
          return "Waiting for your second confirmation of enrolment";
      }
    });

    return {
      firstEnrolmentBannerDetails,
      secondEnrolmentBannerDetails,
      firstEnrolmentLabel,
      secondEnrolmentLabel,
    };
  },
});
</script>
