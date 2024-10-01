<template>
  <!-- COE Banners -->
  <application-status-tracker-banner
    v-if="coeStatus === COEStatus.required"
    label="Waiting for your confirmation of enrolment"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    content="Your institution will check your enrolment closer to your study start date. Please contact the Financial Aid Officer from your institution if you require more information."
  />

  <application-status-tracker-banner
    v-if="coeStatus === COEStatus.completed"
    label="Your enrolment has been confirmed by your institution"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    content="Your institution will check your enrolment closer to your study start date. Please contact the Financial Aid Officer from your institution if you require more information."
    :background-color="
      recentDisbursementUpdate === DisbursementUpdates.EnrolmentCompleted
        ? 'success-bg'
        : 'white'
    "
  />

  <application-status-tracker-banner
    v-if="coeStatus === COEStatus.declined"
    label="Your institution declined your enrolment status"
    icon="fa:fas fa-exclamation-circle"
    icon-color="danger"
    background-color="error-bg"
  >
    <template #content
      ><strong>Your institution declined your enrolment status.</strong> Reason
      from your institution: {{ coeDenialReason }}. The disbursement associated
      with this application has now been cancelled. To receive funding for this
      application, you must 'edit' your application and re-submit in order to
      allow your institution to Confirm your Enrolment again.</template
    >
  </application-status-tracker-banner>

  <!-- disbursement schedule banners-->

  <application-status-tracker-banner
    v-if="disbursementStatus === DisbursementScheduleStatus.Pending"
    label="Waiting to send your payment to NSLSC"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    content="StudentAid BC will let you know when your payment is sent to the National Student Loan Service Centre. Your payment will be collected there."
  />

  <application-status-tracker-banner
    v-if="disbursementStatus === DisbursementScheduleStatus.Sent"
    label="Your payment has been sent to NSLSC"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    content="Your payment has been transferred to the National Student Loan Service Centre (NSLSC). Please collect your payment there. The payment may take time to appear on NSLSC. If you do not see the payment within 3 days, please contact NSLSC."
    :background-color="
      recentDisbursementUpdate === DisbursementUpdates.DisbursementSent
        ? 'success-bg'
        : 'white'
    "
  />
</template>
<script lang="ts">
import ApplicationStatusTrackerBanner from "@/components/common/students/applicationTracker/generic/ApplicationStatusTrackerBanner.vue";
import { COEStatus, DisbursementScheduleStatus } from "@/types";
import { defineComponent, PropType, computed } from "vue";

/**
 * Various updates that can happen to a disbursement.
 */
enum DisbursementUpdates {
  EnrolmentCompleted,
  DisbursementSent,
  EnrolmentDeclined,
}

export default defineComponent({
  components: {
    ApplicationStatusTrackerBanner,
  },
  props: {
    coeStatus: {
      type: String as PropType<COEStatus>,
      required: false,
    },
    coeDenialReason: {
      type: String,
      required: false,
    },
    disbursementStatus: {
      type: String as PropType<DisbursementScheduleStatus>,
      required: false,
    },
  },
  setup(props) {
    // The most recent disbursement update.
    const recentDisbursementUpdate = computed<DisbursementUpdates>(() => {
      if (props.disbursementStatus === DisbursementScheduleStatus.Sent) {
        return DisbursementUpdates.DisbursementSent;
      }
      if (props.coeStatus === COEStatus.completed) {
        return DisbursementUpdates.EnrolmentCompleted;
      }
      return DisbursementUpdates.EnrolmentDeclined;
    });
    return {
      COEStatus,
      DisbursementScheduleStatus,
      recentDisbursementUpdate,
      DisbursementUpdates,
    };
  },
});
</script>
