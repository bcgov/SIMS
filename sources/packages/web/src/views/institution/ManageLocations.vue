<template>
  <div class="p-m-4">
    <HeaderNavigator
      title="Manage Institution Locations"
      subTitle="Location Summary"
    />
    <v-container>
      <v-card class="mt-6 py-4 px-4">
        <LocationSummary />
      </v-card>
    </v-container>
  </div>
</template>

<script lang="ts">
import LocationSummary from "@/components/common/LocationSummary.vue";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";

export default {
  components: {
    LocationSummary,
    HeaderNavigator,
  },
};
</script>
