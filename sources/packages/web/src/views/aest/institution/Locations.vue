<template>
  <tab-container>
    <location-summary
      :institutionId="institutionId"
      @editLocation="gotToEditLocation"
    />
  </tab-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import LocationSummary from "@/components/common/LocationSummary.vue";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import router from "@/router";

export default defineComponent({
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
});
</script>
