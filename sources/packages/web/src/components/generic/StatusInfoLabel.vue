<template>
  <v-icon :icon="icon" :color="data.status" class="progress-info-icon" />
  <span class="mx-2">
    <slot>{{ data.header }}</slot>
  </span>
</template>

<script lang="ts">
import { PropType, computed } from "vue";
import { StatusInfo, StatusInfoDetails } from "@/types";

export default {
  props: {
    data: {
      type: Object as PropType<StatusInfoDetails>,
      required: true,
    },
  },
  setup(props: any) {
    const icon = computed(() => {
      if (props.data.status === StatusInfo.Completed) {
        return "fa:fas fa-check-circle";
      }
      if (props.data.status === StatusInfo.Rejected) {
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
