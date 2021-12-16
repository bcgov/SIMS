<template>
  <v-container>
    <h5 class="text-muted">Manage Institution Locations</h5>
    <h2>Location Summary</h2>
    <v-card class="mt-6 py-4 px-4">
      <LocationSummary :clientType="ClientIdType.Institution" />
    </v-card>
  </v-container>
</template>

<script lang="ts">
import LocationSummary from "@/components/common/LocationSummary.vue";
import { ClientIdType } from "@/types/contracts/ConfigContract";

export default {
  components: {
    LocationSummary,
  },
  setup() {
    return { ClientIdType };
  },
};
</script>
