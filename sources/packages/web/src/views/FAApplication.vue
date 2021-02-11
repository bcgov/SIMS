<template>
  <WelcomePage v-if="!isReady" @user-ready="userReady" />
  <!-- Application Main View-->
  <PersonalInfoQuestionnaire v-else></PersonalInfoQuestionnaire>
</template>

<script lang="ts">
import { ref } from "vue";
import WelcomePage from "../components/fa-application/WelcomePage.vue";
import PersonalInfoQuestionnaire from "./PersonalInfoQuestionnaire.vue";
export default {
  components: {
    WelcomePage,
    PersonalInfoQuestionnaire,
  },
  setup() {
    const isReady = ref(false);
    const userReady = () => {
      isReady.value = true;
    };
    return {
      isReady,
      userReady,
    };
  },
};
</script>

<style></style>
