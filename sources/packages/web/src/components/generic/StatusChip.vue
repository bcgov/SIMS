<template>
  <v-chip :text-color="textColor" :class="chipClass" variant="outlined">
    <v-icon start icon="fa:fa fa-circle" :color="iconColor" size="12" />
    {{ label ?? status }}
  </v-chip>
  <v-chip color="#EEFFEF" variant="outlined"
    ><v-icon start icon="fa:fa fa-circle" size="13" color="#16C92E"></v-icon>
    <span class="label-small default-color">{{ label ?? status }}</span>
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
    const chipColor = computed(() => {
      switch (props.status) {
        case StatusChipTypes.Success:
          return "success";
        case StatusChipTypes.Warning:
          return "warning";
        case StatusChipTypes.Error:
          return "error";
        default:
          return "";
      }
    });
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
      chipColor,
      COLOR_BANNER_SUCCESS,
    };
  },
};
</script>
