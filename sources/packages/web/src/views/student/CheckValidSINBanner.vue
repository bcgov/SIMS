<template>
  <banner
    class="mb-6"
    v-if="showBanner"
    :type="bannerType"
    :summary="sinValidStatus.message"
  >
  </banner>
</template>

<script lang="ts">
import { computed } from "vue";
import { useStudentStore } from "@/composables";
import { SINStatusEnum } from "@/types";
import { BannerTypes } from "@/components/generic/Banner.models";
export default {
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
};
</script>
