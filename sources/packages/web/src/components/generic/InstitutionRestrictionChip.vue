<template>
  <chip-label :status="badgeDetails.status" :label="badgeDetails.label" />
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
      useInstitutionRestrictionState();
    const { mapRestrictionBadgeDetails } = useRestriction();
    const badgeDetails = computed(() =>
      mapRestrictionBadgeDetails(hasActiveRestriction(props.institutionId)),
    );
    onMounted(async () => {
      await updateInstitutionRestrictionState(props.institutionId);
    });
    return { badgeDetails };
  },
});
</script>
