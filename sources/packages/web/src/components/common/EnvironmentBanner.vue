<template>
  <div v-if="!isProduction" class="environment-banner">
    <span class="environment-banner-text">{{ bannerText }}</span>
  </div>
</template>

<script lang="ts">
import { AppConfigService } from "@/services/AppConfigService";
import { defineComponent, computed, ref, onMounted } from "vue";

export default defineComponent({
  setup() {
    const appEnv = ref("");
    const isProduction = ref(false);

    onMounted(async () => {
      // Get environment from env variable APP_ENV | dev, test, staging, production
      const config = await AppConfigService.shared.config();
      appEnv.value = config.appEnv;
      isProduction.value = appEnv.value === "production";
    });

    const bannerText = computed(() => {
      return `Non-Production ${appEnv.value} Environment`;
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
  background-color: #e3a82b;
  /* BC Gold */
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
