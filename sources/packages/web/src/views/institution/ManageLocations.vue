<template>
  <div class="p-m-4">
    <HeaderNavigator
      title="Manage Institution Locations"
      subTitle="Location Summary"
    />
    <v-container>
      <v-card class="mt-6 py-4 px-4">
        <LocationSummary :clientType="ClientIdType.Institution" />
      </v-card>
    </v-container>
  </div>
</template>

<script lang="ts">
import LocationSummary from "@/components/common/LocationSummary.vue";
import { ClientIdType } from "@/types/contracts/ConfigContract";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";

export default {
  components: {
    LocationSummary,
    HeaderNavigator,
  },
  setup() {
    return { ClientIdType };
  },
};
</script>
