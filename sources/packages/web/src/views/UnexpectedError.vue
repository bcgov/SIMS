<template>
  <error-page-container
    title="Something went wrong"
    subtitle="An unexpected error occurred."
  >
    <p>
      Try refreshing the page or returning to the home page. If the problem
      persists, please contact support.
    </p>
    <p v-if="sessionId">
      Please provide this session reference to support:
      <strong>{{ sessionId }}</strong>
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
import { AuthService } from "@/services/AuthService";
import illustration from "../assets/images/person-seeing-screen.svg";

// Same identifier logged by the API for every request of the user session.
const sessionId = AuthService.shared.keycloak?.sessionId;
</script>
