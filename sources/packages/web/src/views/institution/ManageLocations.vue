<template>
  <div class="p-m-4">
    <header-navigator
      title="Manage Institution Locations"
      subTitle="Location Summary"
    />
    <v-container>
      <v-card class="mt-6 py-4 px-4">
        <LocationSummary @editLocation="gotToEditLocation" />
      </v-card>
    </v-container>
  </div>
</template>

<script lang="ts">
import LocationSummary from "@/components/common/LocationSummary.vue";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import router from "@/router";

export default {
  components: {
    LocationSummary,
  },
  setup() {
    const gotToEditLocation = (locationId: number) => {
      return router.push({
        name: InstitutionRoutesConst.EDIT_INSTITUTION_LOCATION,
        params: {
          locationId: locationId,
        },
      });
    };

    return {
      gotToEditLocation,
    };
  },
};
</script>
