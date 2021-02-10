<template>
  <WelcomePage v-if="!isReady" @user-ready="userReady" />
  <!-- Application Main View-->
  <div v-if="isReady">USER IS READY FOR APPLICATION</div>
</template>

<script lang="ts">
import { ref } from "vue";
import WelcomePage from "../components/fa-application/WelcomePage.vue";
export default {
  components: {
    WelcomePage,
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
