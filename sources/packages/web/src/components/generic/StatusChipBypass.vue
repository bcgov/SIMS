<template>
  <chip-status :status="chipStatus" :label="bypassStatus" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import {
  useRestrictionBypassLabel,
  useRestrictionBypassStatus,
} from "@/composables";
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
    const { mapBypassStatus } = useRestrictionBypassStatus();
    const { mapBypassLabel } = useRestrictionBypassLabel();

    const bypassStatus = computed(() =>
      mapBypassLabel(props.isRestrictionActive),
    );
    const chipStatus = computed(() =>
      mapBypassStatus(props.isRestrictionActive),
    );
    return { chipStatus, bypassStatus };
  },
});
</script>
