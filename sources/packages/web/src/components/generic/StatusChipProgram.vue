<template>
  <chip-status :status="chipStatus" :label="overallStatusLabel" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import ChipStatus from "@/components/generic/ChipStatus.vue";
import { useProgram } from "@/composables";
import { ProgramStatus } from "@/types";

export default defineComponent({
  components: { ChipStatus },
  props: {
    status: {
      type: String as PropType<ProgramStatus>,
      required: true,
    },
    isActive: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    const { mapProgramChipStatus } = useProgram();
    const overallStatusLabel = computed(() => {
      if (!props.isActive) {
        return "Inactive";
      }
      return props.status.toString();
    });
    const chipStatus = computed(() =>
      mapProgramChipStatus(props.status, props.isActive),
    );
    return { chipStatus, overallStatusLabel };
  },
});
</script>
