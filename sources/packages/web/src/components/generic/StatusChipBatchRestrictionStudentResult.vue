<template>
  <chip-status :status="statusChipType" :label="status" />
</template>
<script setup lang="ts">
import { computed } from "vue";
import { BatchRestrictionStudentResult, StatusChipTypes } from "@/types";

interface Props {
  status: BatchRestrictionStudentResult;
}

const props = defineProps<Props>();

const statusChipType = computed(() => {
  switch (props.status) {
    case BatchRestrictionStudentResult.Successful:
      return StatusChipTypes.Success;
    case BatchRestrictionStudentResult.Failed:
      return StatusChipTypes.Error;
    default:
      return StatusChipTypes.Inactive;
  }
});
</script>
