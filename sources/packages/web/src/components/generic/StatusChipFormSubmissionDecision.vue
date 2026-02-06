<template>
  <chip-status :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { FormSubmissionDecisionStatus, StatusChipTypes } from "@/types";

export default defineComponent({
  props: {
    status: {
      type: String as PropType<FormSubmissionDecisionStatus>,
      required: true,
    },
  },
  setup(props) {
    const chipStatus = computed(() => {
      switch (props.status) {
        case FormSubmissionDecisionStatus.Approved:
          return StatusChipTypes.Success;
        case FormSubmissionDecisionStatus.Pending:
          return StatusChipTypes.Warning;
        case FormSubmissionDecisionStatus.Declined:
          return StatusChipTypes.Error;
        default:
          return StatusChipTypes.Inactive;
      }
    });
    return { chipStatus };
  },
});
</script>
