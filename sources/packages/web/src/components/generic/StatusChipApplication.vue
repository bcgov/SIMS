<template>
  <v-chip :color="chipColor" variant="outlined"
    ><v-icon start icon="fa:fa fa-circle" size="18"></v-icon>
    {{ statusValue }}
  </v-chip>
</template>
<script lang="ts">
import { ApplicationStatus } from "@/types";
import { computed } from "vue";
export default {
  props: {
    statusValue: {
      type: String,
    },
  },
  setup(props: any) {
    const chipColor = computed(() => {
      switch (props.statusValue) {
        case ApplicationStatus.draft:
          return "default";
        case ApplicationStatus.inProgress:
          return "warning";
        case ApplicationStatus.assessment:
          return "warning";
        case ApplicationStatus.enrollment:
          return "warning";
        case ApplicationStatus.completed:
          return "success";
        case ApplicationStatus.cancelled:
          return "error";
        case ApplicationStatus.submitted:
          return "default";
        default:
          return "";
      }
    });

    return {
      chipColor,
    };
  },
};
</script>
