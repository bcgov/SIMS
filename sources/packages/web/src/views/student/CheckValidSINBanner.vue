<template>
  <banner
    class="mb-6"
    v-if="showBanner"
    :color="bannerColor"
    :summary="sinValidStatus.message"
  >
  </banner>
</template>

<script lang="ts">
import { computed } from "vue";
import { useStudentStore } from "@/composables";
import { SINStatusEnum } from "@/types";
export default {
  setup() {
    const { sinValidStatus, hasStudentAccount } = useStudentStore();

    const showBanner = computed(() => {
      return (
        hasStudentAccount.value &&
        sinValidStatus.value.sinStatus !== SINStatusEnum.VALID
      );
    });

    const bannerColor = computed(() => {
      switch (sinValidStatus.value.sinStatus) {
        case SINStatusEnum.PENDING:
          return "warning";
        case SINStatusEnum.INVALID:
          return "error";
        default:
          return "";
      }
    });

    return { showBanner, sinValidStatus, bannerColor };
  },
};
</script>
