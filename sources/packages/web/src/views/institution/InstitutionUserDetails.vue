<template>
  <v-container>
    <h5 class="text-muted">Manage Users</h5>
    <h2>User Summary</h2>
    <v-sheet elevation="1" class="mx-auto">
      <InstitutionUserSummary :clientType="ClientIdType.Institution" />
    </v-sheet>
  </v-container>
</template>

<script lang="ts">
import InstitutionUserSummary from "@/components/aest/InstitutionUserSummary.vue";
import { ClientIdType } from "@/types";

export default {
  components: {
    InstitutionUserSummary,
  },
  setup() {
    return {
      ClientIdType,
    };
  },
};
</script>

<style></style>
