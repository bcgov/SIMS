<template>
  <v-container>
    <h5 class="text-muted">Manage Institution Locations</h5>
    <h2>Location Summary</h2>
    <v-sheet elevation="1" class="mx-auto">
      <LocationSummary :clientType="ClientIdType.Institution" />
    </v-sheet>
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
