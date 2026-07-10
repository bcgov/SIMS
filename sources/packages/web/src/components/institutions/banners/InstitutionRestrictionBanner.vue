<template>
  <banner
    v-for="banner in banners"
    :key="banner.type"
    class="mt-2"
    :type="banner.type"
    :header="bannerTitle"
    :summary-list="banner.summaryList"
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

    /**
     * Banner title based on the scope of the restriction.
     * @returns The banner title for the given scope.
     */
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

    /**
     * Default message for a specific scope when no banner message is provided by the restriction.
     * @returns The default message for the given scope.
     */
    const getDefaultBannerMessage = computed(() => {
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
    });

    /**
     * Get the default banner message for a specific restriction if no banner message
     * is provided, ensuring they will not be duplicated.
     * @param restrictions the list of restrictions to get the banner messages from.
     * @returns a list of unique banner messages for the given restrictions.
     */
    const getRestrictionMessages = (restrictions: InstitutionRestriction[]) => {
      const messages = restrictions.map(
        (restriction) =>
          restriction.bannerMessage || getDefaultBannerMessage.value,
      );
      return [...new Set(messages)];
    };

    /**
     * Create each banner based on the restriction type and the messages for the given scope.
     * @returns a list of banners to be displayed for the given scope, if some restrictions exist.
     */
    const banners = computed(() => {
      return [
        {
          type: BannerTypes.Error,
          summaryList: getRestrictionMessages(
            effectiveRestrictionState.value.errorRestrictions,
          ),
        },
        {
          type: BannerTypes.Warning,
          summaryList: getRestrictionMessages(
            effectiveRestrictionState.value.warningRestrictions,
          ),
        },
        {
          type: BannerTypes.Info,
          summaryList: getRestrictionMessages(
            effectiveRestrictionState.value.noEffectRestrictions,
          ),
        },
      ].filter((banner) => banner.summaryList.length > 0);
    });

    onMounted(
      async () => await updateInstitutionRestrictionState(props.institutionId),
    );

    return {
      BannerTypes,
      effectiveRestrictionState,
      banners,
      bannerTitle,
    };
  },
});
</script>
