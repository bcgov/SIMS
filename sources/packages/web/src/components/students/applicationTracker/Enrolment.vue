<template>
  <multiple-disbursement-banner
    v-if="applicationCOEDetails?.secondCOE"
    :firstCOEStatus="applicationCOEDetails?.firstCOE?.coeStatus"
    :secondCOEStatus="applicationCOEDetails?.secondCOE?.coeStatus"
    :coeDenialReason="multipleCOEDenialReason"
  />
  <disbursement-banner
    v-else
    :coeStatus="applicationCOEDetails?.firstCOE?.coeStatus"
    :coeDenialReason="applicationCOEDetails?.firstCOE?.coeDenialReason"
  />
</template>
<script lang="ts">
import { COEStatus } from "@/types";
import { onMounted, ref, defineComponent } from "vue";
import { ApplicationService } from "@/services/ApplicationService";
import { ApplicationCOEDetailsAPIOutDTO } from "@/services/http/dto/Application.dto";
import DisbursementBanner from "@/components/students/applicationTracker/DisbursementBanner.vue";
import MultipleDisbursementBanner from "@/components/students/applicationTracker/MultipleDisbursementBanner.vue";

export default defineComponent({
  components: {
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
    const applicationCOEDetails = ref({} as ApplicationCOEDetailsAPIOutDTO);
    const multipleCOEDenialReason = ref<string>();

    onMounted(async () => {
      applicationCOEDetails.value =
        await ApplicationService.shared.getApplicationEnrolmentDetails(
          props.applicationId,
        );
      // Even though if an application has multiple COEs
      // COE can be declined only once, either first COE is declined
      // or the second COE.
      multipleCOEDenialReason.value =
        applicationCOEDetails.value.firstCOE?.coeDenialReason ??
        applicationCOEDetails.value.secondCOE?.coeDenialReason;
    });

    return {
      applicationCOEDetails,
      multipleCOEDenialReason,
      COEStatus,
    };
  },
});
</script>
