<template>
  <Chip
    :label="statusValue"
    class="text-uppercase"
    :class="getApplicationStatusClass()"
  />
</template>
<script lang="ts">
import { ApplicationStatus } from "@/types";
export default {
  props: {
    statusValue: {
      type: String,
    },
  },
  setup(props: any) {
    const getApplicationStatusClass = () => {
      switch (props.statusValue) {
        case ApplicationStatus.draft:
          return "bg-secondary text-white";
        case ApplicationStatus.inProgress:
          return "bg-warning text-white";
        case ApplicationStatus.assessment:
          return "bg-dark text-white";
        case ApplicationStatus.enrollment:
          return "bg-primary text-white";
        case ApplicationStatus.completed:
          return "bg-success text-white";
        case ApplicationStatus.cancelled:
          return "bg-danger text-white";
        case ApplicationStatus.submitted:
          return "bg-info text-white";
        default:
          return "";
      }
    };

    return {
      getApplicationStatusClass,
    };
  },
};
</script>
