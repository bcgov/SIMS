<template>
  <error-page-container
    title="Something went wrong"
    subtitle="An unexpected error occurred."
  >
    <p>
      We are sorry this happened. Try again by going back or returning to the
      home page. If the problem persists, please contact support.
    </p>
    <p v-if="sessionId">
      Contact support with the following reference number:
      <strong>{{ sessionId }}</strong>
      <v-btn
        icon="mdi-content-copy"
        variant="text"
        size="x-small"
        density="comfortable"
        aria-label="Copy reference number"
        @click="copySessionId"
      />
    </p>
    <template #image>
      <v-img
        width="220"
        height="176"
        class="mt-md-8"
        alt="An illustration of an astronaut lost in space."
        :src="illustration"
      />
    </template>
  </error-page-container>
</template>

<script setup lang="ts">
import ErrorPageContainer from "@/components/common/ErrorPageContainer.vue";
import { useSnackBar } from "@/composables";
import { AuthService } from "@/services/AuthService";
import illustration from "../assets/images/lost-in-space.svg";

const snackBar = useSnackBar();

// Same identifier logged by the API for every request of the user session.
const sessionId = AuthService.shared.keycloak?.sessionId;

const copySessionId = async () => {
  try {
    await navigator.clipboard.writeText(sessionId!);
    snackBar.success("Reference number copied to clipboard.");
  } catch {
    snackBar.error("Error copying the reference number to clipboard.");
  }
};
</script>
