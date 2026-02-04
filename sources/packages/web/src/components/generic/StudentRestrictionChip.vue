<template>
  <chip-label :status="badgeDetails.status" :label="badgeDetails.label" />
</template>
<script lang="ts">
import { computed, defineComponent } from "vue";
import { useRestriction } from "@/composables";

export default defineComponent({
  props: {
    hasActiveRestriction: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    const { mapRestrictionBadgeDetails } = useRestriction();
    const badgeDetails = computed(() =>
      mapRestrictionBadgeDetails(props.hasActiveRestriction),
    );
    return { badgeDetails };
  },
});
</script>
