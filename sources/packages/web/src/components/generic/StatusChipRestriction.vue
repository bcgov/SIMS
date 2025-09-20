<template>
  <chip-status
    :status="chipStatus.chipStatus"
    :label="chipStatus.restrictionStatus"
  />
</template>
<script lang="ts">
import { computed, defineComponent } from "vue";
import { useRestriction } from "@/composables";

export default defineComponent({
  props: {
    isActive: {
      type: Boolean,
      required: true,
    },
    deletedAt: {
      type: Date,
      required: false,
    },
  },
  setup(props) {
    const { mapRestrictionChipStatus } = useRestriction();
    const chipStatus = computed(() => mapRestrictionChipStatus(props));
    return { chipStatus };
  },
});
</script>
