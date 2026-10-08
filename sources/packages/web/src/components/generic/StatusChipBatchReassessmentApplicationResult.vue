<template>
  <chip-status :status="statusChipType" :label="status" />
</template>
<script setup lang="ts">
import { computed } from "vue";
import { BatchReassessmentApplicationResult, StatusChipTypes } from "@/types";

interface Props {
  status: BatchReassessmentApplicationResult;
}

const props = defineProps<Props>();

const statusChipType = computed(() => {
  switch (props.status) {
    case BatchReassessmentApplicationResult.Successful:
      return StatusChipTypes.Success;
    case BatchReassessmentApplicationResult.Failed:
      return StatusChipTypes.Error;
    default:
      return StatusChipTypes.Warning;
  }
});
</script>
