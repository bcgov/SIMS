<template>
  <banner
    v-if="hasEffectiveRestrictionStatus.hasEffectiveRestriction"
    class="my-2"
    :type="BannerTypes.Error"
    header="This program is currently restricted"
  />
</template>
<script lang="ts">
import { defineComponent, onMounted } from "vue";
import { BannerTypes } from "@/types/contracts/Banner";
import { useInstitutionRestrictionState } from "@/composables";
export default defineComponent({
  props: {
    locationId: {
      type: Number,
      required: true,
    },
    programId: {
      type: Number,
      required: true,
    },
    institutionId: {
      type: Number,
      required: false,
      default: undefined,
    },
  },
  setup(props) {
    const { getEffectiveRestrictionStatus, updateInstitutionRestrictionState } =
      useInstitutionRestrictionState(props.institutionId);
    const hasEffectiveRestrictionStatus = getEffectiveRestrictionStatus(
      props.locationId,
      props.programId,
    );
    onMounted(updateInstitutionRestrictionState);
    return {
      BannerTypes,
      hasEffectiveRestrictionStatus,
    };
  },
});
</script>
