<template>
  <v-chip :color="chipColor" variant="outlined" :class="chipBackground"
    ><v-icon :color="iconColor" :icon="icon" />
    <span class="mx-1" :class="textColor" v-if="!!label"> {{ label }}</span>
  </v-chip>
</template>
<script lang="ts">
import { computed, defineComponent } from "vue";
import { StatusChipTypes } from "@/types";

export default defineComponent({
  props: {
    status: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: false,
      default: "",
    },
    customIcon: {
      type: String,
      required: false,
      default: "",
    },
  },
  setup(props) {
    const chipColor = computed(() => {
      switch (props.status) {
        case StatusChipTypes.Success:
          return "success";
        case StatusChipTypes.Warning:
          return "warning";
        case StatusChipTypes.Error:
          return "error";
        case StatusChipTypes.Default:
          return "black";
        default:
          return "";
      }
    });

    const iconColor = computed(() => {
      switch (props.status) {
        case StatusChipTypes.Success:
          return "success-shade";
        case StatusChipTypes.Warning:
          return "warning-shade";
        case StatusChipTypes.Error:
          return "error-shade";
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
        case StatusChipTypes.Error:
          return "error-chip-background";
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
        case StatusChipTypes.Error:
          return "error-shade";
        default:
          return "";
      }
    });

    const icon = computed(() => {
      if (props.customIcon) {
        return props.customIcon;
      }
      switch (props.status) {
        case StatusChipTypes.Success:
          return "fa:fa fa-check";
        case StatusChipTypes.Warning:
          return "fa:fa fa-xmark";
        case StatusChipTypes.Error:
          return "fa:fa fa-circle-xmark";
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
});
</script>
