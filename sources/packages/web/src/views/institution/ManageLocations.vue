<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator
        title="Manage institutions"
        subTitle="Manage Locations"
      />
    </template>
    <location-summary @editLocation="gotToEditLocation" />
  </full-page-container>
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
