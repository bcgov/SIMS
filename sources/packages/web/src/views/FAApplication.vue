<template>
  <WelcomePage v-if="!isReady" @user-ready="userReady" />
  <!-- Application Main View-->
  <div v-else>
    <ConfirmStudentAidBCProfileInfo/>
  </div>
</template>

<script lang="ts">
import { ref } from "vue";
import WelcomePage from "../components/fa-application/WelcomePage.vue";
import ConfirmStudentAidBCProfileInfo from "../components/fa-application/ConfirmStudentAidBCProfileInfo.vue";
export default {
  components: {
    WelcomePage,ConfirmStudentAidBCProfileInfo
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
