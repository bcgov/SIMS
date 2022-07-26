<template>
  <v-chip :color="chipColor" variant="outlined"
    ><v-icon start icon="fa:fa fa-circle" size="18"></v-icon>
    {{ status }}
  </v-chip>
</template>
<script lang="ts">
import { ProgramInfoStatus } from "@/types";
import { computed } from "vue";
export default {
  props: {
    status: {
      type: String,
    },
  },
  setup(props: any) {
    const chipColor = computed(() => {
      switch (props.status) {
        case ProgramInfoStatus.submitted:
          return "default";
        case ProgramInfoStatus.completed:
          return "success";
        case ProgramInfoStatus.required:
          return "warning";
        case ProgramInfoStatus.declined:
          return "error";
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
