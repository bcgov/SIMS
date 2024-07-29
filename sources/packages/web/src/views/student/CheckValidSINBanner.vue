<template>
  <banner
    class="mb-2"
    v-if="showBanner"
    :type="bannerType"
    :summary="sinValidStatus.message"
  >
  </banner>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { useStudentStore } from "@/composables";
import { SINStatusEnum } from "@/types";
import { BannerTypes } from "@/types/contracts/Banner";
export default defineComponent({
  setup() {
    const { sinValidStatus, hasStudentAccount } = useStudentStore();

    const showBanner = computed(() => {
      return (
        hasStudentAccount.value &&
        sinValidStatus.value.sinStatus !== SINStatusEnum.VALID
      );
    });

    const bannerType = computed(() => {
      switch (sinValidStatus.value.sinStatus) {
        case SINStatusEnum.PENDING:
          return BannerTypes.Warning;
        case SINStatusEnum.INVALID:
          return BannerTypes.Error;
        default:
          return "";
      }
    });

    return { showBanner, sinValidStatus, bannerType };
  },
});
</script>
