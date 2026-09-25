<template>
  <chip-status :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { BatchReassessmentStatus } from "@/services/http/dto";
import { StatusChipTypes } from "@/types";

export default defineComponent({
  props: {
    status: {
      type: String as PropType<BatchReassessmentStatus>,
      required: true,
    },
  },
  setup(props) {
    const chipStatus = computed(() => {
      return props.status === BatchReassessmentStatus.Completed
        ? StatusChipTypes.Success
        : StatusChipTypes.Warning;
    });
    return { chipStatus };
  },
});
</script>
