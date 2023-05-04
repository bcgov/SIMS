<template>
  <chip-status :status="chipStatus" :label="status" />
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
    const { mapAssessmentHistoryChipStatus } = useAssessment();
    const chipStatus = computed(() =>
      mapAssessmentHistoryChipStatus(props.status),
    );
    return { chipStatus };
  },
});
</script>
