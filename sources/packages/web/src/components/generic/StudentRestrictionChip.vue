<!-- Student restriction badge. -->
<template>
  <v-chip :color="chipColor" variant="outlined" class="v-chip--variant-tonal"
    ><v-icon :icon="icon" size="18"></v-icon>
    <span class="mx-1" v-if="label">{{ label }}</span>
  </v-chip>
</template>
<script lang="ts">
import { computed } from "vue";
import { StudentRestrictionStatus } from "@/types";

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
        case StudentRestrictionStatus.noRestriction:
          return "success";
        case StudentRestrictionStatus.restriction:
          return "warning";
        default:
          return "";
      }
    });

    const label = computed(() => {
      if (props.status === StudentRestrictionStatus.restriction) {
        return StudentRestrictionStatus.restriction;
      } else {
        return "";
      }
    });

    const icon = computed(() => {
      switch (props.status) {
        case StudentRestrictionStatus.noRestriction:
          return "fa:fa fa-check";
        case StudentRestrictionStatus.restriction:
          return "fa:fa fa-xmark";
        default:
          return "";
      }
    });

    return {
      label,
      chipColor,
      icon,
    };
  },
};
</script>
