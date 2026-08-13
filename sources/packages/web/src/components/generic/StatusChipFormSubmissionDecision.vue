<template>
  <chip-status :status="chipStatus" :label="chipLabel" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { FormSubmissionDecisionStatus, FormSubmissionStatus } from "@/types";
import { useFormSubmission } from "@/composables";

export default defineComponent({
  props: {
    status: {
      type: String as PropType<FormSubmissionDecisionStatus | null>,
      required: true,
    },
  },
  setup(props) {
    const { mapFormSubmissionDecisionStatus } = useFormSubmission();
    const chipStatus = computed(() => {
      return mapFormSubmissionDecisionStatus(props.status);
    });
    const chipLabel = computed(() => {
      return props.status ?? FormSubmissionStatus.Cancelled;
    });
    return { chipStatus, chipLabel };
  },
});
</script>
