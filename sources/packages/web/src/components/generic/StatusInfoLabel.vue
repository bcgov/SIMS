<template>
  <v-icon :icon="icon" :color="status" class="status-info-icon" />
  <span class="mx-2">
    <slot></slot>
  </span>
</template>

<script lang="ts">
import { PropType, computed, defineComponent } from "vue";
import { StatusInfo } from "@/types";

export default defineComponent({
  props: {
    status: {
      type: Object as PropType<StatusInfo>,
      required: true,
    },
  },
  setup(props) {
    const icon = computed(() => {
      if (props.status === StatusInfo.Completed) {
        return "fa:fas fa-check-circle";
      }
      if (props.status === StatusInfo.Rejected) {
        return "fa:fas fa-circle-xmark";
      }
      return "fa:fas fa-clock";
    });
    return {
      icon,
    };
  },
});
</script>
