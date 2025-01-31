<template>
  <chip-status :status="chipStatus" :label="chipStatusLabel" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { useAssessment } from "@/composables";
import {
  StudentAppealStatus,
  ApplicationExceptionStatus,
  ApplicationOfferingChangeRequestStatus,
} from "@/types";
export default defineComponent({
  props: {
    status: {
      type: String as PropType<
        | StudentAppealStatus
        | ApplicationExceptionStatus
        | ApplicationOfferingChangeRequestStatus
      >,
      required: true,
    },
  },
  setup(props) {
    const {
      mapRequestAssessmentChipStatus,
      mapRequestAssessmentChipStatusLabel,
    } = useAssessment();
    const chipStatus = computed(() =>
      mapRequestAssessmentChipStatus(props.status),
    );
    const chipStatusLabel = computed(() =>
      mapRequestAssessmentChipStatusLabel(props.status),
    );
    return { chipStatus, chipStatusLabel };
  },
});
</script>
