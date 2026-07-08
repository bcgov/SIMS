<template>
  <banner
    v-if="restrictionErrorMessages.length"
    class="mt-2"
    :type="BannerTypes.Error"
    :header="bannerTitle"
    :summary-list="restrictionErrorMessages"
  />
  <banner
    v-if="restrictionWarningMessages.length"
    class="mt-2"
    :type="BannerTypes.Warning"
    :header="bannerTitle"
    :summary-list="restrictionWarningMessages"
  />
</template>
<script lang="ts">
import { computed, defineComponent, onMounted, PropType } from "vue";
import { BannerTypes } from "@/types/contracts/Banner";
import {
  InstitutionRestriction,
  useInstitutionRestrictionState,
} from "@/composables";
import { InstitutionRestrictionDisplayScope } from "@/types";
export default defineComponent({
  props: {
    scope: {
      type: String as PropType<InstitutionRestrictionDisplayScope>,
      required: true,
    },
    locationId: {
      type: Number,
      required: false,
      default: undefined,
    },
    programId: {
      type: Number,
      required: false,
      default: undefined,
    },
    institutionId: {
      type: Number,
      required: false,
      default: undefined,
    },
  },
  setup(props) {
    const { getEffectiveRestrictionState, updateInstitutionRestrictionState } =
      useInstitutionRestrictionState();
    const effectiveRestrictionState = getEffectiveRestrictionState(() => ({
      scope: props.scope,
      locationId: props.locationId,
      programId: props.programId,
      institutionId: props.institutionId,
    }));

    const getDefaultBannerMessage = () => {
      switch (props.scope) {
        case InstitutionRestrictionDisplayScope.Institution:
          return "Your institution has active restrictions.";
        case InstitutionRestrictionDisplayScope.Location:
          return "Your location has active restrictions.";
        case InstitutionRestrictionDisplayScope.Program:
          return "The program has active restrictions.";
        default:
          throw new Error(`Unknown scope: ${props.scope}.`);
      }
    };

    const getRestrictionMessages = (restrictions: InstitutionRestriction[]) => {
      const messages = restrictions.map(
        (restriction) => restriction.bannerMessage || getDefaultBannerMessage(),
      );
      return [...new Set(messages)];
    };

    const restrictionWarningMessages = computed(() => {
      return getRestrictionMessages(
        effectiveRestrictionState.value.warningRestrictions,
      );
    });

    const restrictionErrorMessages = computed(() => {
      return getRestrictionMessages(
        effectiveRestrictionState.value.errorRestrictions,
      );
    });

    const bannerTitle = computed(() => {
      switch (props.scope) {
        case InstitutionRestrictionDisplayScope.Institution:
          return "Institution Restricted";
        case InstitutionRestrictionDisplayScope.Program:
          return "Program Restricted";
        case InstitutionRestrictionDisplayScope.Location:
          return "Location Restricted";
        default:
          throw new Error(`Unknown scope: ${props.scope}.`);
      }
    });

    onMounted(
      async () => await updateInstitutionRestrictionState(props.institutionId),
    );

    return {
      BannerTypes,
      effectiveRestrictionState,
      restrictionWarningMessages,
      restrictionErrorMessages,
      bannerTitle,
    };
  },
});
</script>
