<template>
  <v-card>
    <v-container :fluid="true">
      <program-details
        :programId="programId"
        :locationId="locationId"
        :educationProgram="educationProgram"
        @program-data-updated="$emit('programDataUpdated')"
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
import { defineComponent } from "vue";
import ProgramDetails from "@/components/common/ProgramDetails.vue";
import OfferingSummary from "@/components/common/OfferingSummary.vue";
import { EducationProgramAPIOutDTO } from "@/services/http/dto";

export default defineComponent({
  emits: {
    programDataUpdated: null,
  },
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
});
</script>
