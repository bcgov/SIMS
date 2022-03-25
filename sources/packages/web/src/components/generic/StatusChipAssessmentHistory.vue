<template>
  <status-chip :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed } from "vue";
import StatusChip from "@/components/generic/StatusChip.vue";
import { useAssessment } from "@/composables";
export default {
  components: { StatusChip },
  props: {
    status: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const { mapAssessmentHistoryChipStatus } = useAssessment();
    const chipStatus = computed(() =>
      mapAssessmentHistoryChipStatus(props.status),
    );
    return { chipStatus };
  },
};
</script>
