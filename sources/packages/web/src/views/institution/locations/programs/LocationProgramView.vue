<template>
  <div class="p-m-4">
    <div class="mb-4">
      <p class="muted-heading-text">
        <a @click="goBack()">
          <v-icon left> mdi-arrow-left </v-icon> Back all programs</a
        locationId: locationId,
        locationName: locationName,
      }"
      subTitle="Program Detail"
    <v-container>
        >
      </p>
      <p class="heading-x-large">View program</p>
    </div>
    <ManageProgramAndOfferingSummary
      :programId="programId"
      :locationId="locationId"
      :clientType="ClientIdType.Institution"
    />
              field="offeringName"
              header="Name"
              :sortable="true"
            ></Column>
    </v-container>
  </div>
</template>

<script lang="ts">
import { useRouter } from "vue-router";
import { InstitutionRoutesConst } from "@/constants/routes/RouteConstants";
import ManageProgramAndOfferingSummary from "@/components/common/ManageProgramAndOfferingSummary.vue";
import { ClientIdType } from "@/types";
import HeaderNavigator from "@/components/generic/HeaderNavigator.vue";

export default {
  components: { ManageProgramAndOfferingSummary },
    HeaderNavigator,
  },
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
  setup(props: any) {
    const router = useRouter();
    const goBack = () => {
      router.push({
        name: InstitutionRoutesConst.LOCATION_PROGRAMS,
        params: {
          locationId: props.locationId,
        },
      });
    };
    return {
      goBack,
      ClientIdType,
      InstitutionRoutesConst,
    };
  },
};
</script>
