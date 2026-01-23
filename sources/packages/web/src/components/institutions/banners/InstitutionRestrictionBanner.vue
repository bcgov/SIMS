<template>
  <banner
    v-if="effectiveRestrictionStatus.hasEffectiveRestriction"
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
      useInstitutionRestrictionState();
    const effectiveRestrictionStatus = getEffectiveRestrictionStatus(() => ({
      locationId: props.locationId,
      programId: props.programId,
      institutionId: props.institutionId,
    }));
    onMounted(
      async () => await updateInstitutionRestrictionState(props.institutionId),
    );
    return {
      BannerTypes,
      effectiveRestrictionStatus,
    };
  },
});
</script>
