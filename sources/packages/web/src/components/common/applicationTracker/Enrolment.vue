<template>
  <related-application-changed
    v-if="
      applicationCOEDetails.assessmentTriggerType ===
      AssessmentTriggerType.RelatedApplicationChanged
    "
  />
  <multiple-disbursement-banner
    v-if="applicationCOEDetails?.secondDisbursement"
    :first-c-o-e-status="applicationCOEDetails?.firstDisbursement?.coeStatus"
    :second-c-o-e-status="applicationCOEDetails?.secondDisbursement?.coeStatus"
    :coe-denial-reason="multipleCOEDenialReason"
  />
  <disbursement-banner
    v-else
    :coe-status="applicationCOEDetails?.firstDisbursement?.coeStatus"
    :coe-denial-reason="
      applicationCOEDetails?.firstDisbursement?.coeDenialReason
    "
  />
</template>
<script lang="ts">
import { COEStatus, AssessmentTriggerType } from "@/types";
import { onMounted, ref, defineComponent } from "vue";
import { ApplicationService } from "@/services/ApplicationService";
import { EnrolmentApplicationDetailsAPIOutDTO } from "@/services/http/dto/Application.dto";
import DisbursementBanner from "@/components/common/applicationTracker/DisbursementBanner.vue";
import MultipleDisbursementBanner from "@/components/common/applicationTracker/MultipleDisbursementBanner.vue";
import RelatedApplicationChanged from "@/components/common/applicationTracker/RelatedApplicationChanged.vue";

export default defineComponent({
  components: {
    DisbursementBanner,
    MultipleDisbursementBanner,
    RelatedApplicationChanged,
  },
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
    studentId: {
      type: Number,
      required: false,
      default: undefined,
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
          { studentId: props.studentId },
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
