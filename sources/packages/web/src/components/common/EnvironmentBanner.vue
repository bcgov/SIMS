<template>
  <div v-if="!isProduction" class="environment-banner">
    <span class="environment-banner-text">{{ bannerText }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { BannerTypes } from "@/types";

export default defineComponent({
  setup() {
    // Get environment from env variable APP_ENV | DEV, TEST, STAGING, PROD
    const environment = process.env.APP_ENV?.toUpperCase() ?? "DEV";
    const isProduction = environment === "PROD";

    const bannerText = computed(() => {
      return `Non-Production ${environment} Environment`;
    });

    return {
      bannerText,
      isProduction,
    };
  },
});
</script>

<style>
/* Global styles to handle layout with banner */
.environment-banner ~ .v-application .v-app-bar {
  top: 18px !important;
}
.environment-banner ~ .v-application {
  padding-top: 18px;
}
</style>

<style scoped>
.environment-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1005;
  background-color: #e3a82b; /* BC Gold */
  color: #000000;
  font-weight: bold;
  text-align: center;
  height: 18px;
}

.environment-banner-text {
  font-size: 12px;
  line-height: 12px;
}
</style>
