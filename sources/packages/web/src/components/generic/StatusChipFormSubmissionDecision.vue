<template>
  <chip-status :status="chipStatus" :label="status" />
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { FormSubmissionDecisionStatus } from "@/types";
import { useFormSubmission } from "@/composables";

export default defineComponent({
  props: {
    status: {
      type: String as PropType<FormSubmissionDecisionStatus>,
      required: true,
    },
  },
  setup(props) {
    const { mapFormSubmissionDecisionStatus } = useFormSubmission();
    const chipStatus = computed(() => {
      return mapFormSubmissionDecisionStatus(props.status);
    });
    return { chipStatus };
  },
});
</script>
