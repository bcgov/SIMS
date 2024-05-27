<template>
  <!-- Student application having one or more disbursement feedback errors that block funding. -->
  <application-status-tracker-banner
    v-if="assessmentDetails.hasBlockFundingFeedbackError"
    label="There is an issue with your funding request"
    icon="fa:fas fa-exclamation-triangle"
    icon-color="warning"
    background-color="warning-bg"
    content="Your request for funding sent to NSLSC was initially rejected because of errors with your assessment and/or with your account. Please contact StudentAid BC for assistance in resolving this issue. Please note, this message may remain after the issue has been resolved."
  />
  <!-- Student appeal - waiting approval -->
  <application-status-tracker-banner
    v-if="assessmentDetails.appealStatus === StudentAppealStatus.Pending"
    label="Your requested change is in progress"
    icon="fa:fas fa-exclamation-triangle"
    icon-color="warning"
    background-color="warning-bg"
    content="StudentAid BC is reviewing your requested change. If your requested change is approved, your application will be re-evaluated with a new assessment below."
  />
  <!-- Student application change request - in progress with student -->
  <application-status-tracker-banner
    v-if="
      assessmentDetails.applicationOfferingChangeRequestStatus ===
      ApplicationOfferingChangeRequestStatus.InProgressWithStudent
    "
    label="Action required! Do you want to allow your institution to make changes to your application?"
    icon="fa:fas fa-exclamation-triangle"
    icon-color="warning"
    background-color="warning-bg"
    content="Your institution is proposing changes to your application. Please review the details and allow (or decline) the proposed change from your institution. Allowing the change will enable StudentAid BC to make a final decision on the proposed changes, which will result in a new assessment if the changes are approved. Please review the changes carefully and contact your institution if you require more information."
  >
    <template #actions>
      <v-btn
        color="primary"
        @click="
          viewApplicationOfferingChangeRequest(
            assessmentDetails.applicationOfferingChangeRequestId,
          )
        "
        >Review changes</v-btn
      >
    </template>
  </application-status-tracker-banner>
  <!-- Student application change request - in progress with ministry -->
  <application-status-tracker-banner
    v-if="
      assessmentDetails.applicationOfferingChangeRequestStatus ===
      ApplicationOfferingChangeRequestStatus.InProgressWithSABC
    "
    label="StudentAid BC is reviewing the requested changes proposed by your institution"
    icon="fa:fas fa-exclamation-triangle"
    icon-color="warning"
    background-color="warning-bg"
    content="If the requested change is approved by StudentAid BC, your application will be re-evaluated with a new assessment below."
  />
  <!-- Scholastic standing changed - student did not complete the program -->
  <application-status-tracker-banner
    v-if="
      assessmentDetails.scholasticStandingChangeType ===
      StudentScholasticStandingChangeType.StudentDidNotCompleteProgram
    "
    label="Your institution reported that you did not complete your studies"
    icon="fa:fas fa-exclamation-circle"
    icon-color="danger"
    background-color="error-bg"
    content="You no longer meet StudentAid BC's requirements to receive funding for financial aid. Any scheduled payments will be cancelled. Please contact the Financial Aid Officer from your institution if you require more information."
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
  <!-- Student application change request - declined by student -->
  <application-status-tracker-banner
    v-if="
      assessmentDetails.applicationOfferingChangeRequestStatus ===
      ApplicationOfferingChangeRequestStatus.DeclinedByStudent
    "
    label="You've declined the requested change proposed by your institution"
    icon="fa:fas fa-exclamation-circle"
    icon-color="danger"
    background-color="error-bg"
    content="Your application will proceed forward, based on your last assessment."
  />
  <!-- Student application change request - declined by ministry -->
  <application-status-tracker-banner
    v-if="
      assessmentDetails.applicationOfferingChangeRequestStatus ===
      ApplicationOfferingChangeRequestStatus.DeclinedBySABC
    "
    label="StudentAid BC declined the requested changes proposed by your institution"
    icon="fa:fas fa-exclamation-circle"
    icon-color="danger"
    background-color="error-bg"
    content="You can review the outcomes of your requested changes in the table below by clicking “View request”. Please note your application will proceed without your requested changes, based on your last assessment."
  />
  <application-status-tracker-banner
    label="Attention! You are not yet eligible to receive funding."
    icon="fa:fas fa-exclamation-circle"
    icon-color="danger"
    background-color="error-bg"
    content="You have applied for disability funding on your application, but your
      disability status on your student profile has not yet been verified. Only
      once your status is verified will you be able to receive funding."
    v-if="!hasValidDisbursement"
    ><template #content
      ><ul>
        <li v-if="!assessmentDetails.hasValidDisabilityStatus">
          You have applied for disability funding on your application, but your
          disability status on your student profile has not yet been verified.
          Only once your status is verified will you be able to receive funding.
        </li>
        <li v-if="!assessmentDetails.hasValidMSFAAStatus">
          You have not yet signed your MSFAA number with the National Student
          Loans Service Center. Your MSFAA number was issued on your Notice of
          Assessment - you must use that number to sign your Master Student
          Financial Assistance Agreement with NSLSC before you are eligible to
          receive your funding. Alternatively, this could be due to your MSFAA
          being cancelled.
        </li>
        <li v-if="assessmentDetails.hasRestriction">
          You have a restriction on your account making you ineligible to
          receive funding. Please contact StudentAid BC if you still require
          assistance in identifying the cause of this issue and help resolving
          the issue.
        </li>
        <li v-if="!assessmentDetails.hasValidSIN">
          Your SIN is invalid and your funding cannot be issued. Contact
          StudentAid BC for assistance.
        </li>
        <li v-if="!assessmentDetails.hasValidCSLPDisbursement">
          Your current funding assessment would exceed your allowable lifetime
          limit for Part-Time Canada Student Loan. Your assessment must be
          adjusted to stay within your lifetime limit. Contact StudentAid BC for
          assistance.
        </li>
      </ul>
    </template>
  </application-status-tracker-banner>
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
  <!-- Related Application Changed -->
  <related-application-changed
    v-if="
      assessmentDetails.assessmentTriggerType ===
      AssessmentTriggerType.RelatedApplicationChanged
    "
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
  <!-- Student application change request - approved by ministry -->
  <application-status-tracker-banner
    v-if="
      assessmentDetails.assessmentTriggerType ===
      AssessmentTriggerType.ApplicationOfferingChange
    "
    label="The requested changes proposed by your institution was approved! Please review your new assessment."
    icon="fa:fas fa-check-circle"
    icon-color="success"
    background-color="success-bg"
    content="StudentAid BC has approved the requested change proposed by your institution. Please review your new assessment in the table below."
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
import {
  ApplicationOfferingChangeRequestStatus,
  AssessmentTriggerType,
  COEStatus,
  StudentAppealStatus,
  StudentScholasticStandingChangeType,
} from "@/types";
import { onMounted, ref, defineComponent, computed } from "vue";
import { ApplicationService } from "@/services/ApplicationService";
import { CompletedApplicationDetailsAPIOutDTO } from "@/services/http/dto/Application.dto";
import ApplicationStatusTrackerBanner from "@/components/students/applicationTracker/generic/ApplicationStatusTrackerBanner.vue";
import DisbursementBanner from "@/components/students/applicationTracker/DisbursementBanner.vue";
import MultipleDisbursementBanner from "@/components/students/applicationTracker/MultipleDisbursementBanner.vue";
import RelatedApplicationChanged from "@/components/students/applicationTracker/RelatedApplicationChanged.vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";

export default defineComponent({
  components: {
    ApplicationStatusTrackerBanner,
    DisbursementBanner,
    MultipleDisbursementBanner,
    RelatedApplicationChanged,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const assessmentDetails = ref({} as CompletedApplicationDetailsAPIOutDTO);
    const multipleCOEDenialReason = ref<string>();
    const hasValidDisbursement = ref<boolean>();

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

      hasValidDisbursement.value =
        assessmentDetails.value.hasValidDisabilityStatus &&
        assessmentDetails.value.hasValidMSFAAStatus &&
        !assessmentDetails.value.hasRestriction &&
        assessmentDetails.value.hasValidSIN &&
        assessmentDetails.value.hasValidCSLPDisbursement;
    });

    const hasDisbursementEvent = computed(() => {
      return (
        assessmentDetails.value.firstDisbursement?.coeStatus !==
        COEStatus.required
      );
    });

    /**
     * Navigate to the form to view the application offering change request.
     * @param applicationOfferingChangeRequestId application offering change request id to have the request created.
     */
    const viewApplicationOfferingChangeRequest = (
      applicationOfferingChangeRequestId: number | undefined,
    ) => {
      router.push({
        name: StudentRoutesConst.STUDENT_REQUESTED_APPLICATION_OFFERING_CHANGE,
        params: {
          applicationOfferingChangeRequestId,
          applicationId: props.applicationId,
        },
      });
    };

    return {
      assessmentDetails,
      multipleCOEDenialReason,
      hasValidDisbursement,
      COEStatus,
      AssessmentTriggerType,
      StudentAppealStatus,
      hasDisbursementEvent,
      StudentScholasticStandingChangeType,
      ApplicationOfferingChangeRequestStatus,
      viewApplicationOfferingChangeRequest,
    };
  },
});
</script>
