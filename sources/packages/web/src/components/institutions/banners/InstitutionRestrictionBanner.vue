<template>
  <banner
    v-if="restrictionErrorMessages.length"
    class="my-2"
    :type="BannerTypes.Error"
    header="Institution Restricted"
    :summary-list="restrictionErrorMessages"
  />
  <banner
    v-if="restrictionWarningMessages.length"
    class="my-2"
    :type="BannerTypes.Warning"
    header="Institution Restricted"
    :summary-list="restrictionWarningMessages"
  />
</template>
<script lang="ts">
import { computed, defineComponent, onMounted } from "vue";
import { BannerTypes } from "@/types/contracts/Banner";
import { useInstitutionRestrictionState } from "@/composables";
import { RestrictionCode } from "@/types";
export default defineComponent({
  props: {
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
      locationId: props.locationId,
      programId: props.programId,
      institutionId: props.institutionId,
    }));

    const getRestrictionMessages = (restrictionsCodes: string[]) => {
      const messages = restrictionsCodes.map((code) => {
        if (code === RestrictionCode.InstitutionUnderReview) {
          return "Your institution is currently under review.";
        }
        return "Your institution has active restrictions.";
      });
      return [...new Set(messages)];
    };

    const restrictionWarningMessages = computed(() => {
      return getRestrictionMessages(
        effectiveRestrictionState.value.warningRestrictions.map(
          (restriction) => restriction.restrictionCode,
        ),
      );
    });

    const restrictionErrorMessages = computed(() => {
      return getRestrictionMessages(
        effectiveRestrictionState.value.errorRestrictions.map(
          (restriction) => restriction.restrictionCode,
        ),
      );
    });

    onMounted(
      async () => await updateInstitutionRestrictionState(props.institutionId),
    );

    return {
      BannerTypes,
      effectiveRestrictionState,
      restrictionWarningMessages,
      restrictionErrorMessages,
    };
  },
});
</script>
