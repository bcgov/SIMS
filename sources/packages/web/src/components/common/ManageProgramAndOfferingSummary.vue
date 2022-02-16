<template>
  <div>
    <ProgramDetailHeader
      :educationProgram="educationProgram"
      :institutionId="institutionId"
    />
    <v-card>
      <v-container>
        <ProgramDetails
          :programId="programId"
          :locationId="locationId"
          :educationProgram="educationProgram"
        />
        <hr class="horizontal-divider" />
        <OfferingSummary :programId="programId" :locationId="locationId" />
      </v-container>
    </v-card>
  </div>
</template>

<script lang="ts">
import ProgramDetails from "@/components/common/ProgramDetails.vue";
import OfferingSummary from "@/components/common/OfferingSummary.vue";
import ProgramDetailHeader from "@/components/common/ProgramDetailHeader.vue";

import { EducationProgramData } from "@/types";

export default {
  components: { ProgramDetails, OfferingSummary, ProgramDetailHeader },
  props: {
    programId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: true,
    },
    educationProgram: {
      type: Object,
      required: true,
      default: {} as EducationProgramData,
    },
    institutionId: {
      type: Number,
      required: false,
    },
  },
};
</script>
