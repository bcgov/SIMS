<template>
  <chip-label :status="badgeDetails.status" :label="badgeDetails.label" />
</template>
<script lang="ts">
import { computed, defineComponent, watchEffect } from "vue";
import { useInstitutionRestrictionState, useRestriction } from "@/composables";

export default defineComponent({
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const { updateInstitutionRestrictionState, hasActiveRestriction } =
      useInstitutionRestrictionState();
    const { mapRestrictionBadgeDetails } = useRestriction();
    const hasRestriction = hasActiveRestriction(() => ({
      institutionId: props.institutionId,
    }));
    const badgeDetails = computed(() =>
      mapRestrictionBadgeDetails(hasRestriction.value),
    );
    watchEffect(async () => {
      await updateInstitutionRestrictionState(props.institutionId);
    });
    return { badgeDetails };
  },
});
</script>
