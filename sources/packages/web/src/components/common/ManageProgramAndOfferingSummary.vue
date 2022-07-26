<template>
  <div>
    <program-offering-detail-header
      class="m-4"
      :headerDetails="{
        ...educationProgram,
        institutionId: institutionId,
        status: educationProgram.programStatus,
      }"
    />
    <v-card>
      <v-container>
        <ProgramDetails
          :programId="programId"
          :locationId="locationId"
          :educationProgram="educationProgram"
        />
        <hr class="horizontal-divider" />
        <OfferingSummary
          :programId="programId"
          :locationId="locationId"
          :institutionId="institutionId"
        />
      </v-container>
    </v-card>
  </div>
</template>

<script lang="ts">
import ProgramDetails from "@/components/common/ProgramDetails.vue";
import OfferingSummary from "@/components/common/OfferingSummary.vue";
import ProgramOfferingDetailHeader from "@/components/common/ProgramOfferingDetailHeader.vue";
import { EducationProgramDetailsAPIOutDTO } from "@/services/http/dto";

export default {
  components: { ProgramDetails, OfferingSummary, ProgramOfferingDetailHeader },
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
      default: {} as EducationProgramDetailsAPIOutDTO,
    },
    institutionId: {
      type: Number,
      required: false,
    },
  },
};
</script>
