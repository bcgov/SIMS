<template>
  <banner class="mb-2" :type="BannerTypes.Warning" :header="bannerText" />
</template>
<script lang="ts">
import { onMounted, ref, computed } from "vue";
import { PrecedingOfferingSummaryAPIOutDTO } from "@/services/http/dto";
import { EducationProgramOfferingService } from "@/services/EducationProgramOfferingService";
import { BannerTypes } from "@/components/generic/Banner.models";
export default {
  props: {
    offeringId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const precedingOffering = ref({} as PrecedingOfferingSummaryAPIOutDTO);
    const bannerText = computed(() => {
      if (precedingOffering.value?.applicationsCount > 1) {
        return `There are ${precedingOffering.value.applicationsCount} financial aid applications with this offering.`;
      }
      return precedingOffering.value?.applicationsCount === 1
        ? "There is 1 financial aid application with this offering."
        : "There are no financial aid applications with this offering.";
    });

    onMounted(async () => {
      precedingOffering.value =
        await EducationProgramOfferingService.shared.getPrecedingOfferingSummary(
          props.offeringId,
        );
    });

    return {
      BannerTypes,
      bannerText,
    };
  },
};
</script>
