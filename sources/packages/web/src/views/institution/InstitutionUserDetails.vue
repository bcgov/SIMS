<template>
  <v-container>
    <h5 class="text-muted">Manage Users</h5>
    <h2>User Summary</h2>
    <v-card class="mt-6 py-4 px-4">
      <InstitutionUserSummary :clientType="ClientIdType.Institution" />
    </v-card>
  </v-container>
</template>

<script lang="ts">
import InstitutionUserSummary from "@/components/common/InstitutionUserSummary.vue";
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
