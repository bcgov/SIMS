<template>
  <chip-status :status="chipStatus" :label="bypassStatus" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { useRestrictionBypass } from "@/composables";
import { BypassStatusChipLabelTypes } from "@/types";
import ChipStatus from "@/components/generic/ChipStatus.vue";

export default defineComponent({
  components: { ChipStatus },
  props: {
    isBypassActive: {
      type: Boolean as PropType<boolean>,
      required: true,
    },
  },
  setup(props) {
    const { mapBypassStatus } = useRestrictionBypass();
    const bypassStatus = computed(() => {
      return props.isBypassActive
        ? BypassStatusChipLabelTypes.Active
        : BypassStatusChipLabelTypes.Removed;
    });
    const chipStatus = computed(() => mapBypassStatus(props.isBypassActive));
    return { chipStatus, bypassStatus };
  },
});
</script>
