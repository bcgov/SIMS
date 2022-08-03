<template>
  <v-chip :color="chipColor" variant="outlined" :class="chipBackground"
    ><v-icon :color="iconColor" :icon="icon" size="18" />
    <span class="mx-1" :class="textColor" v-if="!(!defaultBadge && !label)">
      {{ label ?? status }}</span
    >
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
    /**
     * When property is true its is a normal status like chip
     * and when it is false it is a designation or restriction
     * chip with background color and different icon.
     */
    defaultBadge: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  setup(props: any) {
    const chipColor = computed(() => {
      if (props.defaultBadge) {
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
      } else {
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
      }
    });

    const iconColor = computed(() => {
      if (props.defaultBadge) {
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
      } else {
        switch (props.status) {
          case StatusChipTypes.Success:
            return "success_shade";
          case StatusChipTypes.Warning:
            return "warning_shade";
          default:
            return "";
        }
      }
    });

    const chipBackground = computed(() => {
      if (!props.defaultBadge) {
        switch (props.status) {
          case StatusChipTypes.Success:
            return "success-chip-background";
          case StatusChipTypes.Warning:
            return "warning-chip-background";
          default:
            return "";
        }
      }
      return "";
    });

    const textColor = computed(() => {
      if (!props.defaultBadge) {
        switch (props.status) {
          case StatusChipTypes.Success:
            return "success-shade";
          case StatusChipTypes.Warning:
            return "warning-shade";
          default:
            return "default-color";
        }
      }
      return "default-color";
    });

    const icon = computed(() => {
      if (!props.defaultBadge) {
        switch (props.status) {
          case StatusChipTypes.Success:
            return "fa:fa fa-check";
          case StatusChipTypes.Warning:
            return "fa:fa fa-xmark";
          default:
            return "fa:fa fa-circle";
        }
      }
      return "fa:fa fa-circle";
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
