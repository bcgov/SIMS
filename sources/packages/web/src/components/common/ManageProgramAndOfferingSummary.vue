<template>
  <program-details
    :program-id="programId"
    :location-id="locationId"
    :education-program="educationProgram"
    :allow-edit="allowEdit && educationProgram.isActive"
    :allow-deactivate="allowDeactivate && educationProgram.isActive"
    :show-program-actions="showProgramActions"
    :can-create-offering="canCreateOffering"
    @program-data-updated="$emit('programDataUpdated')"
  />
  <offering-summary
    :program-id="programId"
    :location-id="locationId"
    :allow-edit="allowEdit && educationProgram.isActive"
    :institution-id="institutionId"
  />
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
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
      type: Object as PropType<EducationProgramAPIOutDTO>,
      required: true,
    },
    institutionId: {
      type: Number,
      required: false,
      default: undefined,
    },
    allowEdit: {
      type: Boolean,
      required: false,
      default: true,
    },
    allowDeactivate: {
      type: Boolean,
      required: false,
      default: true,
    },
    /**
     * Shows the program actions (view program and deactivate).
     * Used only by the Ministry.
     */
    showProgramActions: {
      type: Boolean,
      required: false,
      default: false,
    },
    canCreateOffering: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
});
</script>
