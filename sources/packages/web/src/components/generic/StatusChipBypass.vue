<template>
  <chip-status :status="chipStatus" :label="bypassStatus" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { useRestrictionBypass } from "@/composables";
import { StatusChipTypes } from "@/types";
import ChipStatus from "@/components/generic/ChipStatus.vue";

export default defineComponent({
  components: { ChipStatus },
  props: {
    isRestrictionActive: {
      type: Boolean as PropType<boolean>,
      required: true,
    },
  },
  setup(props) {
    const { mapBypassStatus } = useRestrictionBypass();
    const bypassStatus = computed(() => {
      return props.isRestrictionActive
        ? StatusChipTypes.Warning
        : StatusChipTypes.Success;
    });
    const chipStatus = computed(() =>
      mapBypassStatus(props.isRestrictionActive),
    );
    return { chipStatus, bypassStatus };
  },
});
</script>
