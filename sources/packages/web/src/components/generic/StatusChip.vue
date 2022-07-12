<template>
  <v-chip :text-color="textColor" :class="chipClass" variant="outlined">
    <v-icon start icon="fa:fa fa-circle" :color="iconColor" size="12" />
    {{ label ?? status }}
  </v-chip>
</template>
<script lang="ts">
import { computed } from "vue";
import { StatusChipTypes } from "@/components/generic/StatusChip.models";
import {
  COLOR_BLACK,
  COLOR_BANNER_SUCCESS,
  COLOR_BANNER_WARNING,
  COLOR_BANNER_ERROR,
} from "@/constants";

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
    const iconColor = computed(() => {
      switch (props.status) {
        case StatusChipTypes.Success:
          return COLOR_BANNER_SUCCESS;
        case StatusChipTypes.Warning:
          return COLOR_BANNER_WARNING;
        case StatusChipTypes.Error:
          return COLOR_BANNER_ERROR;
        default:
          return COLOR_BLACK;
      }
    });

    const chipClass = computed(() => {
      switch (props.status) {
        case StatusChipTypes.Success:
          return "status-chip-success";
        case StatusChipTypes.Warning:
          return "status-chip-warning";
        case StatusChipTypes.Error:
          return "status-chip-error";
        default:
          return "status-chip-inactive";
      }
    });

    const textColor = computed(() => {
      return COLOR_BLACK;
    });

    return {
      chipClass,
      textColor,
      iconColor,
    };
  },
};
</script>
