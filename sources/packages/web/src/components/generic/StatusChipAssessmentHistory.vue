<template>
  <chip-status :status="chipStatus" :label="chipLabel" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import ChipStatus from "@/components/generic/ChipStatus.vue";
import { useAssessment } from "@/composables";
import { StudentAssessmentStatus } from "@/types";
export default defineComponent({
  components: { ChipStatus },
  props: {
    status: {
      type: String as PropType<StudentAssessmentStatus>,
      required: true,
    },
  },
  setup(props) {
    const { mapAssessmentHistoryChipStatus, mapAssessmentHistoryChipLabel } =
      useAssessment();
    const chipStatus = computed(() =>
      mapAssessmentHistoryChipStatus(props.status),
    );
    const chipLabel = computed(() =>
      mapAssessmentHistoryChipLabel(props.status),
    );
    return { chipStatus, chipLabel };
  },
});
</script>
