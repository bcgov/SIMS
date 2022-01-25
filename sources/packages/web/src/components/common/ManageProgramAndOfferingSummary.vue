<template>
  <v-card>
    <v-container>
      <ProgramDetails
        :programId="programId"
        :locationId="locationId"
        :clientType="clientType"
      />
      <hr class="horizontal-divider" />
      <OfferingSummary
        :programId="programId"
        :locationId="locationId"
        :clientType="clientType"
      />
    </v-container>
  </v-card>
</template>

<script lang="ts">
import ProgramDetails from "@/components/common/ProgramDetails.vue";
import OfferingSummary from "@/components/common/OfferingSummary.vue";

export default {
  components: { ProgramDetails, OfferingSummary },
  props: {
    programId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: false,
    },
    clientType: {
      type: String,
      required: true,
    },
  },
};
</script>
