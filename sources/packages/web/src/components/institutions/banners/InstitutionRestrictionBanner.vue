<template>
  <banner
    v-if="showBanner"
    class="my-2"
    :type="BannerTypes.Error"
    header="This program is currently restricted"
  />
</template>
<script lang="ts">
import { computed, defineComponent, PropType, ref, watchEffect } from "vue";
import { BannerTypes } from "@/types/contracts/Banner";
import { RestrictionService } from "@/services/RestrictionService";
import { EffectiveRestrictionStatus } from "@/types";
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
    isDataLoadedExternally: {
      type: Boolean,
      required: false,
      default: false,
    },
    effectiveRestrictionStatus: {
      type: Object as PropType<EffectiveRestrictionStatus>,
      required: false,
      default: undefined,
    },
  },
  setup(props) {
    const restrictionStatus = ref<EffectiveRestrictionStatus>();
    const showBanner = computed(
      () => !!restrictionStatus.value?.hasEffectiveRestriction,
    );
    watchEffect(async () => {
      if (props.isDataLoadedExternally) {
        restrictionStatus.value = props.effectiveRestrictionStatus;
        return;
      }
      if (props.locationId && props.programId) {
        restrictionStatus.value =
          await RestrictionService.shared.getEffectiveInstitutionRestrictionStatus(
            props.locationId,
            props.programId,
            { institutionId: props.institutionId },
          );
      }
    });
    return {
      BannerTypes,
      showBanner,
    };
  },
});
</script>
