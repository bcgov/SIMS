<template>
  <v-icon :icon="icon" :color="data.status" class="progress-info-icon" />
  {{ data.header }}
</template>

<script lang="ts">
import { PropType, computed } from "vue";
import { ProgressInfoDetails, ProgressInfoStatus } from "@/types";

export default {
  props: {
    data: {
      type: Object as PropType<ProgressInfoDetails>,
      required: false,
    },
  },
  setup(props: any) {
    const icon = computed(() => {
      if (props.data.status === ProgressInfoStatus.Completed) {
        return "fa:fas fa-check-circle";
      }
      if (props.data.status === ProgressInfoStatus.Rejected) {
        return "fa:fas fa-circle-xmark";
      }
      return "fa:fas fa-clock";
    });
    return {
      icon,
    };
  },
};
</script>
