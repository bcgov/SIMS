<template>
  <chip-status :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed } from "vue";
import ChipStatus from "@/components/generic/ChipStatus.vue";
import { useAssessment } from "@/composables";
export default {
  components: { ChipStatus },
  props: {
    status: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const { mapRequestAssessmentChipStatus } = useAssessment();
    const chipStatus = computed(() =>
      mapRequestAssessmentChipStatus(props.status),
    );
    return { chipStatus };
  },
};
</script>
