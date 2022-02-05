<template>
  <div class="p-m-4">
    <HeaderNavigator
      title="Back all programs"
      :routeName="InstitutionRoutesConst.LOCATION_PROGRAMS"
      :routeParams="{
        locationId: locationId,
      }"
      subTitle="View program"
    >
    </HeaderNavigator>

    <v-container>
      <ManageProgramAndOfferingSummary
        :programId="programId"
        :locationId="locationId"
        :clientType="ClientIdType.Institution"
      />
    </v-container>
  </div>
</template>

<script lang="ts">
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import ManageProgramAndOfferingSummary from "@/components/common/ManageProgramAndOfferingSummary.vue";
import { ClientIdType } from "@/types";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";

export default {
  components: { ManageProgramAndOfferingSummary, HeaderNavigator },
  props: {
    programId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: true,
    },
  },
  setup() {
    return {
      ClientIdType,
      InstitutionRoutesConst,
    };
  },
};
</script>
