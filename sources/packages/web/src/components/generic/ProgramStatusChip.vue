<!--
status Badge
-->
<template>
  <v-badge :color="backGroundColor" :text-color="textColor" :class="badgeClass">
    <template v-slot:badge>
      <font-awesome-icon
        :icon="['fas', 'circle']"
        class="mr-1"
        :color="iconColor"
      />
      <span class="text-uppercase">{{ status }}</span>
    </template>
  </v-badge>
</template>
<script lang="ts">
import { computed } from "vue";
import { ProgramStatus } from "@/types";
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
  },
  setup(props: any) {
    const iconColor = computed(() => {
      switch (props.status) {
        case ProgramStatus.Approved:
          /**
           * Education Program is approved.
           */
          return COLOR_BANNER_SUCCESS;
        case ProgramStatus.Pending:
          /**
           * Education Program is pending.
           */
          return COLOR_BANNER_WARNING;
        case ProgramStatus.Declined:
          /**
           * Education Program is denied.
           */
          return COLOR_BANNER_ERROR;
        default:
          return "";
      }
    });

    const backGroundColor = computed(() => {
      return COLOR_WHITE;
    });

    const textColor = computed(() => {
      return COLOR_BLACK;
    });

    const badgeClass = computed(() => {
      switch (props.status) {
        case ProgramStatus.Approved:
          /**
           * Education Program is approved.
           */
          return "status-badge-success";
        case ProgramStatus.Pending:
          /**
           * Education Program is pending.
           */
          return "status-badge-warning";
        case ProgramStatus.Declined:
          /**
           * Education Program is denied.
           */
          return "status-badge-error";
        default:
          return "";
      }
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
