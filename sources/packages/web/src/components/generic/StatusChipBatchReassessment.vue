<template>
  <chip-status :status="statusChipType" :label="status" />
</template>
<script setup lang="ts">
import { computed } from "vue";
import { BatchReassessmentStatus, StatusChipTypes } from "@/types";

interface Props {
  status: BatchReassessmentStatus;
}

const props = defineProps<Props>();

const statusChipType = computed(() =>
  props.status === BatchReassessmentStatus.Completed
    ? StatusChipTypes.Success
    : StatusChipTypes.Warning,
);
</script>
