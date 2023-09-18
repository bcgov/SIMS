<template>
  <banner
    class="mb-2"
    :type="BannerTypes.Warning"
    :header="bannerText"
    :summary="bannerSummary"
  />
</template>
<script lang="ts">
import { ref, defineComponent } from "vue";
import { BannerTypes } from "@/types/contracts/Banner";
export default defineComponent({
  setup() {
    const bannerText = ref("This request is still pending with the student");
    const bannerSummary = ref(
      "The option to approve or decline for reassessment will be available once the student gives permission for the change. Please follow back shortly or contact the student.",
    );
    return {
      BannerTypes,
      bannerText,
      bannerSummary,
    };
  },
});
</script>
