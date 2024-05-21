<template>
  <application-status-tracker-banner
    label="Attention! You are not yet eligible to receive funding."
    icon="fa:fas fa-exclamation-circle"
    icon-color="danger"
    background-color="error-bg"
    content="You have applied for disability funding on your application, but your
      disability status on your student profile has not yet been verified. Only
      once your status is verified will you be able to receive funding."
    v-if="!applicationCOEDetails.verifiedDisabilityStatus"
  />

  <application-status-tracker-banner
    label="Attention! You are not yet eligible to receive funding."
    icon="fa:fas fa-exclamation-circle"
    icon-color="danger"
    background-color="error-bg"
    content="You have not yet signed your MSFAA number with the National Student Loans
      Service Center. Your MSFAA number was issued on your Notice of Assessment
      - you must use that number to sign your Master Student Financial
      Assistance Agreement with NSLSC before you are eligible to receive your
      funding. Alternatively, this could be due to your MSFAA being cancelled."
    v-if="!applicationCOEDetails.hasValidMSFAAStatus"
  />

  <application-status-tracker-banner
    label="Attention! You are not yet eligible to receive funding."
    icon="fa:fas fa-exclamation-circle"
    icon-color="danger"
    background-color="error-bg"
    content="You have a restriction on your account making you ineligible to receive
      funding. Please contact StudentAid BC if you still require assistance in
      identifying the cause of this issue and help resolving the issue."
    v-if="applicationCOEDetails.hasRestriction"
  />

  <related-application-changed
    v-if="
      applicationCOEDetails.assessmentTriggerType ===
      AssessmentTriggerType.RelatedApplicationChanged
    "
  />
  <multiple-disbursement-banner
    v-if="applicationCOEDetails?.secondDisbursement"
    :firstCOEStatus="applicationCOEDetails?.firstDisbursement?.coeStatus"
    :secondCOEStatus="applicationCOEDetails?.secondDisbursement?.coeStatus"
    :coeDenialReason="multipleCOEDenialReason"
  />
  <disbursement-banner
    v-else
    :coeStatus="applicationCOEDetails?.firstDisbursement?.coeStatus"
    :coeDenialReason="applicationCOEDetails?.firstDisbursement?.coeDenialReason"
  />
</template>
<script lang="ts">
import { COEStatus, AssessmentTriggerType } from "@/types";
import { onMounted, ref, defineComponent } from "vue";
import { ApplicationService } from "@/services/ApplicationService";
import { EnrolmentApplicationDetailsAPIOutDTO } from "@/services/http/dto/Application.dto";
import DisbursementBanner from "@/components/students/applicationTracker/DisbursementBanner.vue";
import MultipleDisbursementBanner from "@/components/students/applicationTracker/MultipleDisbursementBanner.vue";
import RelatedApplicationChanged from "@/components/students/applicationTracker/RelatedApplicationChanged.vue";
import ApplicationStatusTrackerBanner from "@/components/students/applicationTracker/generic/ApplicationStatusTrackerBanner.vue";

export default defineComponent({
  components: {
    DisbursementBanner,
    MultipleDisbursementBanner,
    RelatedApplicationChanged,
    ApplicationStatusTrackerBanner,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const applicationCOEDetails = ref(
      {} as EnrolmentApplicationDetailsAPIOutDTO,
    );
    const multipleCOEDenialReason = ref<string>();

    onMounted(async () => {
      applicationCOEDetails.value =
        await ApplicationService.shared.getEnrolmentApplicationDetails(
          props.applicationId,
        );
      // Even though if an application has multiple COEs
      // COE can be declined only once, either first COE is declined
      // or the second COE.
      multipleCOEDenialReason.value =
        applicationCOEDetails.value.firstDisbursement?.coeDenialReason ??
        applicationCOEDetails.value.secondDisbursement?.coeDenialReason;
    });

    return {
      AssessmentTriggerType,
      applicationCOEDetails,
      multipleCOEDenialReason,
      COEStatus,
    };
  },
});
</script>
