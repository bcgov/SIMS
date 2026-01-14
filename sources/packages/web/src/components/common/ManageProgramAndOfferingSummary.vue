<template>
  <institution-restriction-banner v-if="hasEffectiveRestriction" />
  <v-card>
    <v-container :fluid="true">
      <program-details
        :program-id="programId"
        :location-id="locationId"
        :education-program="educationProgram"
        :allow-edit="allowEdit && isProgramEditable"
        :allow-deactivate="allowDeactivate && isProgramEditable"
        :can-create-offering="canCreateOffering"
        @program-data-updated="$emit('programDataUpdated')"
      />
      <hr class="horizontal-divider" />
      <offering-summary
        :program-id="programId"
        :location-id="locationId"
        :allow-edit="allowEdit && isProgramEditable"
        :institution-id="institutionId"
      />
    </v-container>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watchEffect } from "vue";
import ProgramDetails from "@/components/common/ProgramDetails.vue";
import OfferingSummary from "@/components/common/OfferingSummary.vue";
import InstitutionRestrictionBanner from "@/components/institutions/banners/InstitutionRestrictionBanner.vue";
import { EducationProgramAPIOutDTO } from "@/services/http/dto";
import { RestrictionService } from "@/services/RestrictionService";

export default defineComponent({
  emits: {
    programDataUpdated: null,
  },
  components: { ProgramDetails, OfferingSummary, InstitutionRestrictionBanner },
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
      default: {} as EducationProgramAPIOutDTO,
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
  },
  setup(props) {
    const hasEffectiveRestriction = ref(false);
    const canCreateOffering = ref(false);
    watchEffect(async () => {
      if (props.locationId && props.programId) {
        const effectiveRestrictionStatus =
          await RestrictionService.shared.getEffectiveInstitutionRestrictionStatus(
            props.locationId,
            props.programId,
            { institutionId: props.institutionId },
          );
        hasEffectiveRestriction.value =
          effectiveRestrictionStatus.hasEffectiveRestriction;
        canCreateOffering.value = effectiveRestrictionStatus.canCreateOffering;
      }
    });
    const isProgramEditable = computed(
      () =>
        props.educationProgram.isActive && !props.educationProgram.isExpired,
    );
    return {
      isProgramEditable,
      hasEffectiveRestriction,
      canCreateOffering,
    };
  },
});
</script>
