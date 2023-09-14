<template>
  <banner
    class="mb-2"
    :type="BannerTypes.Warning"
    :header="bannerText"
    :summary="bannerSummary"
  />
</template>
<script lang="ts">
import { ref, defineComponent, watchEffect } from "vue";
import { PrecedingOfferingSummaryAPIOutDTO } from "@/services/http/dto";
import { BannerTypes } from "@/types/contracts/Banner";
export default defineComponent({
  props: {
    offeringId: {
      type: Number,
      required: true,
    },
    precedingOfferingApplicationsCount: {
      type: Number,
      required: false,
    },
  },
  setup(props) {
    const precedingOffering = ref({} as PrecedingOfferingSummaryAPIOutDTO);
    const bannerText = ref("");
    const bannerSummary = ref("");
    watchEffect(() => {
      if (props.precedingOfferingApplicationsCount) {
        if (props.precedingOfferingApplicationsCount > 1) {
          bannerText.value = `There are ${precedingOffering.value.applicationsCount} financial aid applications with this offering.`;
        }
        bannerText.value =
          props.precedingOfferingApplicationsCount === 1
            ? "There is 1 financial aid application with this offering."
            : "There are no financial aid applications with this offering.";
        bannerSummary.value = "";
      } else {
        bannerText.value = "This request is still pending with the student";
        bannerSummary.value =
          "The option to approve or decline for reassessment will be available once the student gives permission for the change. Please follow back shortly or contact the student.";
      }
    });

    return {
      BannerTypes,
      bannerText,
      bannerSummary,
    };
  },
});
</script>
