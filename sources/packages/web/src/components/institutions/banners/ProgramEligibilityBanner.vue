<template>
  <banner
    :type="BannerTypes.Warning"
    :header="header"
    :summary="summary"
    density="compact"
    class="my-2"
  >
    <template v-if="$slots.content" #content>
      <slot name="content"></slot>
    </template>
  </banner>
</template>
<script setup lang="ts">
import { BannerTypes } from "@/types";

interface ProgramEligibilityBannerProps {
  summary?: string;
  header?: string;
}

withDefaults(defineProps<ProgramEligibilityBannerProps>(), {
  header: "This program is ineligible for StudentAid BC funding",
  summary: undefined,
});
</script>
