<template>
  <v-card>
    <v-container>
      <program-details
        :programId="programId"
        :locationId="locationId"
        :educationProgram="educationProgram"
      />
      <hr class="horizontal-divider" />
      <offering-summary
        :programId="programId"
        :locationId="locationId"
        :institutionId="institutionId"
      />
    </v-container>
  </v-card>
</template>

<script lang="ts">
import ProgramDetails from "@/components/common/ProgramDetails.vue";
import OfferingSummary from "@/components/common/OfferingSummary.vue";
import { EducationProgramAPIOutDTO } from "@/services/http/dto";

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
    educationProgram: {
      type: Object,
      required: true,
      default: {} as EducationProgramAPIOutDTO,
    },
    institutionId: {
      type: Number,
      required: false,
    },
  },
};
</script>
