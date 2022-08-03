<template>
  <v-chip :color="chipColor" variant="outlined" :class="chipBackground"
    ><v-icon :color="iconColor" :icon="icon" />
    <span class="mx-1" :class="textColor" v-if="!!label"> {{ label }}</span>
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

    const iconColor = computed(() => {
      switch (props.status) {
        case StatusChipTypes.Success:
          return "success_shade";
        case StatusChipTypes.Warning:
          return "warning_shade";
        default:
          return "";
      }
    });

    const chipBackground = computed(() => {
      switch (props.status) {
        case StatusChipTypes.Success:
          return "success-chip-background";
        case StatusChipTypes.Warning:
          return "warning-chip-background";
        default:
          return "";
      }
    });

    const textColor = computed(() => {
      switch (props.status) {
        case StatusChipTypes.Success:
          return "success-shade";
        case StatusChipTypes.Warning:
          return "warning-shade";
        default:
          return "";
      }
    });

    const icon = computed(() => {
      switch (props.status) {
        case StatusChipTypes.Success:
          return "fa:fa fa-check";
        case StatusChipTypes.Warning:
          return "fa:fa fa-xmark";
        default:
          return "";
      }
    });

    return {
      chipBackground,
      textColor,
      iconColor,
      chipColor,
      icon,
    };
  },
};
</script>
