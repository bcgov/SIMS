<template>
  <v-card>
    <v-container>
      <ProgramDetails :programId="programId" :locationId="locationId" />
      <hr class="horizontal-divider" />
      <OfferingSummary :programId="programId" :locationId="locationId" />
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
      required: true,
    },
  },
};
</script>
