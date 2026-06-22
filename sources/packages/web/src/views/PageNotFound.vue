<template>
  <error-page-container
    title="Error 404"
    subtitle="We couldn't find the webpage."
  >
    <p>Try refreshing the page or check the webpage URL for typos.</p>
    <template #image>
      <v-img
        width="220"
        height="204"
        class="mt-md-8"
        alt="An illustration of a 404 error."
        :src="illustration"
      />
    </template>
  </error-page-container>
</template>

<script setup lang="ts">
import ErrorPageContainer from "@/components/common/ErrorPageContainer.vue";
import illustration from "../assets/images/404.svg";
</script>
