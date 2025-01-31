<template>
  <chip-status :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { usePIR } from "@/composables";
import { ProgramInfoStatus } from "@/types";
export default defineComponent({
  props: {
    status: {
      type: String as PropType<ProgramInfoStatus>,
      required: true,
    },
  },
  setup(props) {
    const { mapPIRChipStatus } = usePIR();
    const chipStatus = computed(() => mapPIRChipStatus(props.status));
    return { chipStatus };
  },
});
</script>
