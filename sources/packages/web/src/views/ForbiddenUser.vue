<template>
  <error-page-container
    title="Access denied"
    subtitle="You don't have permission to view this page."
  >
    <p>
      If you think this is an error, try returning to the home page or contact
      support.
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
import illustration from "../assets/images/lost-in-space.svg";
</script>
