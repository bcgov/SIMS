<template>
  <v-chip :color="chipColor" variant="outlined"
    ><v-icon :color="iconColor" icon="fa:fa fa-circle" size="15" />
    <span class="mx-1 default-color"> {{ label ?? status }}</span>
  </v-chip>
</template>
<script lang="ts">
import { computed } from "vue";
import { StatusChipTypes } from "@/components/generic/StatusChip.models";

export default {
  props: {
    status: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: false,
    },
  },
  setup(props: any) {
    const chipColor = computed(() => {
      switch (props.status) {
        case StatusChipTypes.Success:
          return "success_bg";
        case StatusChipTypes.Warning:
          return "warning_bg";
        case StatusChipTypes.Error:
          return "error_bg";
        case StatusChipTypes.Default:
          return "border";
        default:
          return "";
      }
    });

    const iconColor = computed(() => {
      switch (props.status) {
        case StatusChipTypes.Success:
          return "success";
        case StatusChipTypes.Warning:
          return "warning";
        case StatusChipTypes.Error:
          return "error";
        case StatusChipTypes.Default:
          return "default";
        default:
          return "";
      }
    });

    return {
      iconColor,
      chipColor,
    };
  },
};
</script>
