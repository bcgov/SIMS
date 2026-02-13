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
      props.status === FormSubmissionStatus.Pending
        ? FormSubmissionStatus.Pending
        : FormSubmissionStatus.Completed,
    );
    const chipStatus = computed(() =>
      props.status === FormSubmissionStatus.Pending
        ? StatusChipTypes.Warning
        : StatusChipTypes.Success,
    );
    return { chipStatus, label };
  },
});
</script>
