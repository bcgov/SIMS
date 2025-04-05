<template>
  <application-status-tracker-banner
    v-if="!!changeRequest"
    label="You have a submitted change request that is still pending. Please see below for the next steps."
    icon="fa:fas fa-exclamation-triangle"
    icon-color="warning"
    background-color="warning-bg"
  >
    <template #content
      ><strong>Currently your change request is waiting for:</strong>
      <ul>
        <li
          v-if="
            changeRequest?.applicationEditStatus ===
            ApplicationEditStatus.ChangePendingApproval
          "
        >
          Waiting on Student Aid BC to approve the change.
        </li>
        <li
          v-if="
            changeRequest.parent1Info === SuccessWaitingStatus.Waiting ||
            changeRequest.parent2Info === SuccessWaitingStatus.Waiting
          "
        >
          Pending parent declaration information.
        </li>
        <li v-if="changeRequest.partnerInfo === SuccessWaitingStatus.Waiting">
          Pending partner declaration information.
        </li>
        <li
          v-if="
            changeRequest.studentIncomeVerificationStatus ===
            SuccessWaitingStatus.Waiting
          "
        >
          Pending student income verification information.
        </li>
        <li
          v-if="
            changeRequest.parent1IncomeVerificationStatus ===
              SuccessWaitingStatus.Waiting ||
            changeRequest.parent2IncomeVerificationStatus ===
              SuccessWaitingStatus.Waiting
          "
        >
          Pending parent income verification information.
        </li>
        <li
          v-if="
            changeRequest.partnerIncomeVerificationStatus ===
            SuccessWaitingStatus.Waiting
          "
        >
          Pending partner income verification information.
        </li>
      </ul>
    </template>
  </application-status-tracker-banner>
</template>
<script lang="ts">
import ApplicationStatusTrackerBanner from "@/components/common/applicationTracker/generic/ApplicationStatusTrackerBanner.vue";
import { ChangeRequestInProgressAPIOutDTO } from "@/services/http/dto";
import { defineComponent, PropType } from "vue";
import { ApplicationEditStatus, SuccessWaitingStatus } from "@/types";

export default defineComponent({
  components: {
    ApplicationStatusTrackerBanner,
  },
  props: {
    changeRequest: {
      type: Object as PropType<ChangeRequestInProgressAPIOutDTO>,
      required: false,
    },
  },
  setup() {
    return {
      SuccessWaitingStatus,
      ApplicationEditStatus,
    };
  },
});
</script>
