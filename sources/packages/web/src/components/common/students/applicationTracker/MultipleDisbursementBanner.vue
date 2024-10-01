<template>
  <!-- first enrolment banners -->
  <application-status-tracker-banner
    v-if="firstCOEStatus === COEStatus.required"
    label="Waiting for your first confirmation of enrolment"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    content="Your institution will check your enrolment closer to your study start date. Please contact the Financial Aid Officer from your institution if you require more information."
  />

  <application-status-tracker-banner
    v-if="firstCOEStatus === COEStatus.completed"
    label="Your first enrolment has been confirmed by your institution"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    content="Your institution will check your enrolment closer to your study start date. Please contact the Financial Aid Officer from your institution if you require more information."
    :background-color="
      recentDisbursementUpdate === DisbursementUpdates.FirstEnrolmentCompleted
        ? 'success-bg'
        : 'white'
    "
  />

  <application-status-tracker-banner
    v-if="firstCOEStatus === COEStatus.declined"
    label="Your institution declined your enrolment status"
    icon="fa:fas fa-exclamation-circle"
    icon-color="danger"
    background-color="error-bg"
  >
    <template #content
      ><strong>Your institution declined your enrolment status.</strong> Reason
      from your institution: {{ coeDenialReason }}. All disbursements associated
      with this application have now been cancelled. To receive funding for this
      application, you must 'edit' your application and re-submit in order to
      allow your institution to Confirm your Enrolment again.</template
    >
  </application-status-tracker-banner>

  <!-- first disbursement schedule banners-->

  <application-status-tracker-banner
    v-if="firstDisbursementStatus === DisbursementScheduleStatus.Pending"
    label="Waiting to send your first payment to NSLSC"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    content="StudentAid BC will let you know when your payment is sent to the National Student Loan Service Centre. Your payment will be collected there."
  />

  <application-status-tracker-banner
    v-if="firstDisbursementStatus === DisbursementScheduleStatus.Sent"
    label="Your first payment has been sent to NSLSC"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    content="Your first payment has been transferred to the National Student Loan Service Centre (NSLSC). Please collect your payment there. The payment may take time to appear on NSLSC. If you do not see the payment within 3 days, please contact NSLSC."
    :background-color="
      recentDisbursementUpdate === DisbursementUpdates.FirstDisbursementSent
        ? 'success-bg'
        : 'white'
    "
  />

  <!-- Second enrolment banners -->

  <application-status-tracker-banner
    v-if="secondCOEStatus === COEStatus.required"
    label="Waiting for your second confirmation of enrolment"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    content="Your institution will check your enrolment closer to your study start date. Please contact the Financial Aid Officer from your institution if you require more information."
  />

  <application-status-tracker-banner
    v-if="secondCOEStatus === COEStatus.completed"
    label="Your second enrolment has been confirmed by your institution"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    content="Your institution will check your enrolment closer to your study start date. Please contact the Financial Aid Officer from your institution if you require more information."
    :background-color="
      recentDisbursementUpdate === DisbursementUpdates.SecondEnrolmentCompleted
        ? 'success-bg'
        : 'white'
    "
  />

  <application-status-tracker-banner
    v-if="secondCOEStatus === COEStatus.declined"
    label="Your institution declined your second enrolment status"
    icon="fa:fas fa-exclamation-circle"
    icon-color="danger"
    :background-color="
      recentDisbursementUpdate === DisbursementUpdates.SecondEnrolmentDeclined
        ? 'error-bg'
        : 'white'
    "
  >
    <template #content
      ><span class="font-bold">Reason from your institution:</span>
      {{ coeDenialReason }}. Please note any scheduled payment(s) will be
      cancelled.
    </template>
  </application-status-tracker-banner>

  <!-- second disbursement schedule banners-->

  <application-status-tracker-banner
    v-if="
      secondDisbursementStatus === DisbursementScheduleStatus.Pending &&
      secondCOEStatus !== COEStatus.declined
    "
    label="Waiting to send your second payment to NSLSC"
    icon="fa:fas fa-clock"
    icon-color="secondary"
    content="StudentAid BC will let you know when your payment is sent to the National Student Loan Service Centre. Your payment will be collected there."
  />

  <application-status-tracker-banner
    v-if="secondDisbursementStatus === DisbursementScheduleStatus.Sent"
    label="Your second payment has been sent to NSLSC"
    icon="fa:fas fa-check-circle"
    icon-color="success"
    content="Your second payment has been transferred to the National Student Loan Service Centre (NSLSC). Please collect your payment there. The payment may take time to appear on NSLSC. If you do not see the payment within 3 days, please contact NSLSC."
    :background-color="
      recentDisbursementUpdate === DisbursementUpdates.SecondDisbursementSent
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
  FirstEnrolmentCompleted,
  FirstDisbursementSent,
  SecondEnrolmentCompleted,
  SecondDisbursementSent,
  SecondEnrolmentDeclined,
}

export default defineComponent({
  components: {
    ApplicationStatusTrackerBanner,
  },
  props: {
    firstCOEStatus: {
      type: String as PropType<COEStatus>,
      required: false,
    },
    secondCOEStatus: {
      type: String as PropType<COEStatus>,
      required: false,
    },
    coeDenialReason: {
      type: String,
      required: false,
    },
    firstDisbursementStatus: {
      type: String as PropType<DisbursementScheduleStatus>,
      required: false,
    },
    secondDisbursementStatus: {
      type: String as PropType<DisbursementScheduleStatus>,
      required: false,
    },
  },
  setup(props) {
    // The most recent disbursement update.
    const recentDisbursementUpdate = computed<DisbursementUpdates>(() => {
      if (props.secondCOEStatus === COEStatus.declined) {
        return DisbursementUpdates.SecondEnrolmentDeclined;
      }
      if (props.secondDisbursementStatus === DisbursementScheduleStatus.Sent) {
        return DisbursementUpdates.SecondDisbursementSent;
      }
      if (props.secondCOEStatus === COEStatus.completed) {
        return DisbursementUpdates.SecondEnrolmentCompleted;
      }
      if (props.firstDisbursementStatus === DisbursementScheduleStatus.Sent) {
        return DisbursementUpdates.FirstDisbursementSent;
      }
      return DisbursementUpdates.FirstEnrolmentCompleted;
    });
    return {
      COEStatus,
      DisbursementScheduleStatus,
      DisbursementUpdates,
      recentDisbursementUpdate,
    };
  },
});
</script>
