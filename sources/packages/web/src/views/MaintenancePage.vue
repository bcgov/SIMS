<template>
  <error-page-container
    title="Service temporarily unavailable"
    subtitle="We're performing maintenance."
  >
    <p>
      The Student Information Management System is currently unavailable for
      maintenance. Please try again later.
    </p>
    <p>We apologize for the inconvenience and appreciate your patience.</p>
    <template #image>
      <v-img
        width="220"
        height="183"
        alt="An illustration of two people holding an unplugged cord. Illustration by storyset."
        :src="illustration"
      />
    </template>
  </error-page-container>
</template>

<script setup lang="ts">
import ErrorPageContainer from "@/components/common/ErrorPageContainer.vue";
import illustration from "../assets/images/person-unplugged.svg";
</script>
