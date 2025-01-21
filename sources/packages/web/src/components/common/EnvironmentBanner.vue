<template>
  <v-app-bar
    v-if="environment !== 'production'"
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
    const environment = ref("");
    onMounted(async () => {
      // Get environment from env variable APP_ENV | dev, test, staging, production
      const { appEnv } = await AppConfigService.shared.config();
      environment.value = appEnv;
    });

    const bannerText = computed(() => {
      return `Non-Production ${environment.value} Environment`;
    });

    return {
      bannerText,
      environment,
    };
  },
});
</script>
