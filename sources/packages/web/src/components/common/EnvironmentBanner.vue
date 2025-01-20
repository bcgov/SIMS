<template>
  <v-app-bar
    v-if="!isProduction"
    height="20"
    color="#e3a82b"
    class="environment-banner"
  >
    <v-app-bar-title>{{ bannerText }}</v-app-bar-title>
  </v-app-bar>
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
