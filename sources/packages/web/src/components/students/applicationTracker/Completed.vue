<template>
  <!-- Student appeal - waiting approval -->
  <application-status-tracker-banner
    v-if="assessmentDetails.appealStatus === StudentAppealStatus.Pending"
    label="Your requested change is in progress"
    icon="fa:fas fa-exclamation-triangle"
    icon-color="warning"
    background-color="warning-bg"
    content="StudentAid BC is reviewing your requested change. If your requested change is approved, your application will be re-evaluated with a new assessment below."
  />
  <!-- Student appeal - declined -->
  <application-status-tracker-banner
    v-if="assessmentDetails.appealStatus === StudentAppealStatus.Declined"
    label="Your requested change was declined"
    icon="fa:fas fa-exclamation-circle"
    icon-color="danger"
    background-color="error-bg"
    content="StudentAid BC has determined an outcome with 1 or more of your requested changes. You can review the outcomes of your requested changes in the table below by clicking “View request”. Please note your application will proceed without your requested changes, based on your last assessment."
  />
  <!-- Student appeal - approved -->
  <application-status-tracker-banner
    v-if="
      assessmentDetails.assessmentTriggerType ===
      AssessmentTriggerType.StudentAppeal
    "
    label="Your requested change was approved! Please review your new assessment."
    icon="fa:fas fa-check-circle"
    icon-color="success"
    :background-color="hasDisbursementEvent ? undefined : 'success-bg'"
    content="StudentAid BC has determined an outcome with 1 or more of your requested change. Please review your new assessment in the table below."
  />
  <!-- Scholastic standing changed -->
  <application-status-tracker-banner
    v-if="
      assessmentDetails.assessmentTriggerType ===
      AssessmentTriggerType.ScholasticStandingChange
    "
    label="You have a new assessment due to your scholastic standing"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    :background-color="hasDisbursementEvent ? undefined : 'success-bg'"
    content="Your institution informed us of your scholastic standing, which changed your assessment evaluation. Please review your new assessment in the table below. You can also click “View request” to see the details from your institution. Please contact the Financial Aid Officer from your institution, if you have questions about your scholastic standing."
  />
  <!-- Offering changed -->
  <application-status-tracker-banner
    v-if="
      assessmentDetails.assessmentTriggerType ===
      AssessmentTriggerType.OfferingChange
    "
    label="You have a new assessment due to an update with your study period"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    :background-color="hasDisbursementEvent ? undefined : 'success-bg'"
    content="Your institution updated the study period that was submitted with your application, which changed your assessment evaluation. Please review your new assessment in the table below. If you have concerns or require more information, please contact the Financial Aid Officer from your institution."
  />
  <!-- Disbursement/COE banners -->
  <multiple-disbursement-banner
    v-if="assessmentDetails.secondDisbursement"
    :firstCOEStatus="assessmentDetails.firstDisbursement?.coeStatus"
    :secondCOEStatus="assessmentDetails.secondDisbursement?.coeStatus"
    :coeDenialReason="multipleCOEDenialReason"
    :firstDisbursementStatus="
      assessmentDetails.firstDisbursement?.disbursementScheduleStatus
    "
    :secondDisbursementStatus="
      assessmentDetails.secondDisbursement?.disbursementScheduleStatus
    "
  />
  <disbursement-banner
    v-else
    :coeStatus="assessmentDetails.firstDisbursement?.coeStatus"
    :coeDenialReason="assessmentDetails.firstDisbursement?.coeDenialReason"
    :disbursementStatus="
      assessmentDetails.firstDisbursement?.disbursementScheduleStatus
    "
  />
</template>
<script lang="ts">
import { AssessmentTriggerType, COEStatus, StudentAppealStatus } from "@/types";
import { onMounted, ref, defineComponent, computed } from "vue";
import { ApplicationService } from "@/services/ApplicationService";
import { CompletedApplicationDetailsAPIOutDTO } from "@/services/http/dto/Application.dto";
import ApplicationStatusTrackerBanner from "@/components/students/applicationTracker/generic/ApplicationStatusTrackerBanner.vue";
import DisbursementBanner from "@/components/students/applicationTracker/DisbursementBanner.vue";
import MultipleDisbursementBanner from "@/components/students/applicationTracker/MultipleDisbursementBanner.vue";

export default defineComponent({
  components: {
    ApplicationStatusTrackerBanner,
    DisbursementBanner,
    MultipleDisbursementBanner,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const assessmentDetails = ref({} as CompletedApplicationDetailsAPIOutDTO);
    const multipleCOEDenialReason = ref<string>();

    onMounted(async () => {
      assessmentDetails.value =
        await ApplicationService.shared.getCompletedApplicationDetails(
          props.applicationId,
        );
      // Even though if an application has multiple COEs
      // COE can be declined only once, either first COE is declined
      // or the second COE.
      multipleCOEDenialReason.value =
        assessmentDetails.value.firstDisbursement?.coeDenialReason ??
        assessmentDetails.value.secondDisbursement?.coeDenialReason;
    });

    const hasDisbursementEvent = computed(() => {
      return (
        assessmentDetails.value.firstDisbursement.coeStatus !==
        COEStatus.required
      );
    });

    return {
      assessmentDetails,
      multipleCOEDenialReason,
      COEStatus,
      AssessmentTriggerType,
      StudentAppealStatus,
      hasDisbursementEvent,
    };
  },
});
</script>
