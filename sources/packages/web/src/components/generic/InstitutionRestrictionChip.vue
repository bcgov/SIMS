<template>
  <chip-label :status="chipStatus" :label="chipLabel" />
</template>
<script lang="ts">
import { computed, defineComponent, onMounted } from "vue";
import ChipLabel from "@/components/generic/ChipLabel.vue";
import { useInstitutionRestrictionState, useRestriction } from "@/composables";

export default defineComponent({
  components: { ChipLabel },
  props: {
    institutionId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const { updateInstitutionRestrictionState, hasActiveRestriction } =
      useInstitutionRestrictionState(props.institutionId);
    const { mapRestrictionBadgeLabel, mapRestrictionBadgeStatus } =
      useRestriction();
    const chipStatus = computed(() =>
      mapRestrictionBadgeStatus(hasActiveRestriction.value),
    );
    const chipLabel = computed(() =>
      mapRestrictionBadgeLabel(hasActiveRestriction.value),
    );
    onMounted(updateInstitutionRestrictionState);
    return { chipStatus, chipLabel };
  },
});
</script>
