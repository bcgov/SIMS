<template>
  <chip-status :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import ChipStatus from "@/components/generic/ChipStatus.vue";
import { useAssessment } from "@/composables";
import { StudentAppealStatus, ApplicationExceptionStatus } from "@/types";
export default defineComponent({
  components: { ChipStatus },
  props: {
    status: {
      type: String as PropType<
        StudentAppealStatus | ApplicationExceptionStatus
      >,
      required: true,
    },
  },
  setup(props) {
    const { mapRequestAssessmentChipStatus } = useAssessment();
    const chipStatus = computed(() =>
      mapRequestAssessmentChipStatus(props.status),
    );
    return { chipStatus };
  },
});
</script>
