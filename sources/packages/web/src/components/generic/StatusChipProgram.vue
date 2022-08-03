<template>
  <status-chip :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed } from "vue";
import StatusChip from "@/components/generic/ChipStatus.vue";
import { useProgram } from "@/composables";
export default {
  components: { StatusChip },
  props: {
    status: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const { mapProgramChipStatus } = useProgram();
    const chipStatus = computed(() => mapProgramChipStatus(props.status));
    return { chipStatus };
  },
};
</script>
