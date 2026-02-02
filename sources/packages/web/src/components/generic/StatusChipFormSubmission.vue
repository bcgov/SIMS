<template>
  <chip-status :status="chipStatus" :label="status" />
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
    const chipStatus = computed(() =>
      props.status === FormSubmissionStatus.Completed
        ? StatusChipTypes.Success
        : StatusChipTypes.Warning,
    );
    return { chipStatus };
  },
});
</script>
