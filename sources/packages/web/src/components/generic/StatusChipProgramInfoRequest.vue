<template>
  <chip-status :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed, defineComponent } from "vue";
import ChipStatus from "@/components/generic/ChipStatus.vue";
import { usePIR } from "@/composables";
export default defineComponent({
  components: { ChipStatus },
  props: {
    status: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const { mapPIRChipStatus } = usePIR();
    const chipStatus = computed(() => mapPIRChipStatus(props.status));
    return { chipStatus };
  },
});
</script>
