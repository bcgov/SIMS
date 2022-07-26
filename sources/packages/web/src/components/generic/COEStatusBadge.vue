<!-- COE Status Badge -->
<template>
  <v-chip :color="chipColor" variant="outlined"
    ><v-icon start icon="fa:fa fa-circle" size="13"></v-icon>
    <span class="label-small default-color">{{ status }}</span>
  </v-chip>
</template>
<script lang="ts">
import { computed } from "vue";
import { COEStatus } from "@/types";

export default {
  props: {
    status: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const chipColor = computed(() => {
      switch (props.status) {
        case COEStatus.completed:
          return "success";
        case COEStatus.declined:
          return "error";
        case COEStatus.required:
          return "warning";
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
