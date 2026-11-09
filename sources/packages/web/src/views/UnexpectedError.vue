<template>
  <error-page-container
    title="Something went wrong"
    subtitle="An unexpected error occurred."
  >
    <p>
      Try refreshing the page or returning to the home page. If the problem
      persists, please contact support.
    </p>
    <template #image>
      <v-img
        width="220"
        height="176"
        class="mt-md-8"
        alt="An illustration of a person looking at a screen."
        :src="illustration"
      />
    </template>
  </error-page-container>
</template>

<script setup lang="ts">
import ErrorPageContainer from "@/components/common/ErrorPageContainer.vue";
import illustration from "../assets/images/person-seeing-screen.svg";
</script>
