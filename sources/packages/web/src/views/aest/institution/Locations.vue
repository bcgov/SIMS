<template>
  <v-card class="mt-4">
    <div class="mx-5 py-4">
      <LocationSummary
        :institutionId="institutionId"
        @editLocation="gotToEditLocation"
      />
    </div>
  </v-card>
</template>

<script lang="ts">
import LocationSummary from "@/components/common/LocationSummary.vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import router from "@/router";

export default {
  components: { LocationSummary },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props: any) {
    const gotToEditLocation = (locationId: number) => {
      return router.push({
        name: AESTRoutesConst.EDIT_INSTITUTION_LOCATION,
        params: {
          institutionId: props.institutionId,
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
