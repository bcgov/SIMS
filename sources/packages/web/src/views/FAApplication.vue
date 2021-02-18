<template>
  <WelcomePage v-if="!isReady" />
  <!-- Application Main View-->
  <div v-else>
    <div class="card">
      <Steps :model="applicationSteps" :readonly="false"></Steps>
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
  </div>
</template>

<script lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import Steps from "primevue/steps";
import WelcomePage from "../components/fa-application/WelcomePage.vue";

const applicationSteps = [
  {
    label: "Personal Information",
    to: "/application/personal-info",
  },
  {
    label: "Select Program",
    to: "/application/select-program",
  },
  {
    label: "Financial Information",
    to: "/application/financial-information",
  },
  {
    label: "Confirm Submission",
    to: "/application/confirm-submission",
  },
];

export default {
  components: {
    Steps,
    WelcomePage,
  },
  setup() {
    const isReady = ref(false);
    const route = useRoute();
    if (route.path !== "/application") {
      isReady.value = true;
    }
    return {
      isReady,
      applicationSteps,
    };
  },
};
</script>

<style></style>
