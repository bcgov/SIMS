<template>
  <WelcomePage v-if="!isReady" />
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
import WelcomePage from "../../../components/partial-view/student/financial-aid-application/WelcomePage.vue";

const applicationSteps = [
  {
    label: "Personal Information",
    to: "/student/application/personal-info",
  },
  {
    label: "Select Program",
    to: "/student/application/select-program",
  },
  {
    label: "Financial Information",
    to: "/student/application/financial-info",
  },
  {
    label: "Confirm Submission",
    to: "/student/application/confirm-submission",
  },
];

export default {
  components: {
    Steps,
    WelcomePage,
  },
  setup() {
    console.log("In FAA.vue");
    const isReady = ref(false);
    const route = useRoute();
    console.log(`route.path in faa is ${route.path}`);
    if (route.path !== "/student/application") {
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
