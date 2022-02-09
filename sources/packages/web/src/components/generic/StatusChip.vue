<template>
  <v-badge :color="backGroundColor" :text-color="textColor" :class="badgeClass">
    <template v-slot:badge>
      <font-awesome-icon
        :icon="['fas', 'circle']"
        class="mr-1"
        :color="iconColor"
      />
      <span class="text-uppercase">{{ label ?? status }}</span>
    </template>
  </v-badge>
</template>
<script lang="ts">
import { computed } from "vue";
import { StatusChipTypes } from "@/components/generic/StatusChip.models";
import {
  COLOR_BLACK,
  COLOR_WHITE,
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
          return COLOR_BANNER_ERROR;
      }
    });

    const badgeClass = computed(() => {
      switch (props.status) {
        case StatusChipTypes.Success:
          return "status-badge-success";
        case StatusChipTypes.Warning:
          return "status-badge-warning";
        case StatusChipTypes.Error:
          return "status-badge-error";
        default:
          return "status-badge-inactive";
      }
    });

    const backGroundColor = computed(() => {
      return COLOR_WHITE;
    });

    const textColor = computed(() => {
      return COLOR_BLACK;
    });

    return {
      badgeClass,
      textColor,
      backGroundColor,
      iconColor,
    };
  },
};
</script>
