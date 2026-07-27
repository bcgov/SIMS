<template>
  <chip-status :status="chipStatus" :label="label" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { FormSubmissionStatus, StatusChipTypes } from "@/types";

export default defineComponent({
  props: {
    status: {
      type: String as PropType<FormSubmissionStatus>,
      required: true,
    },
  },
  setup(props) {
    const label = computed(() =>
      // Transform the final status declined of a form submission to a completed status for the chip display.
      // Any other status will be displayed as is.
      props.status === FormSubmissionStatus.Declined
        ? FormSubmissionStatus.Completed
        : props.status,
    );
    const chipStatus = computed(() => {
      switch (props.status) {
        case FormSubmissionStatus.Pending:
          return StatusChipTypes.Warning;
        case FormSubmissionStatus.Completed:
        case FormSubmissionStatus.Declined:
          return StatusChipTypes.Success;
        case FormSubmissionStatus.Cancelled:
          return StatusChipTypes.Error;
        default:
          return StatusChipTypes.Inactive;
      }
    });
    return { chipStatus, label };
  },
});
</script>
