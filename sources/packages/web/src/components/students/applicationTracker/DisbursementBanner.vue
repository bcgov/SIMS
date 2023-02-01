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
    background-color="success-bg"
  />

  <application-status-tracker-banner
    v-if="coeStatus === COEStatus.declined"
    label="Your institution declined your enrolment status"
    icon="fa:fas fa-exclamation-circle"
    icon-color="danger"
    background-color="error-bg"
  >
    <template #content
      ><span class="font-bold">Reason from your institution:</span>
      {{ coeDenialReason }}. Please note any scheduled payment(s) will be
      cancelled.</template
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
    background-color="success-bg"
  />
</template>
<script lang="ts">
import ApplicationStatusTrackerBanner from "@/components/students/applicationTracker/generic/ApplicationStatusTrackerBanner.vue";
import { COEStatus, DisbursementScheduleStatus } from "@/types";
import { defineComponent, PropType } from "vue";

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
    disbursementStatus: {
      type: String as PropType<DisbursementScheduleStatus>,
      required: false,
    },
  },
  setup() {
    return {
      COEStatus,
      DisbursementScheduleStatus,
    };
  },
});
</script>
