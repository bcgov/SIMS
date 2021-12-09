<!--
status Badge
-->
<template>
  <v-badge :color="backGroundColor" :text-color="textColor" :class="badgeClass">
    <template v-slot:badge>
      <font-awesome-icon icon="circle" class="mr-1" :color="iconColor" />
      <span class="text-uppercase">{{ status }}</span>
    </template>
  </v-badge>
</template>
<script lang="ts">
import { computed } from "vue";
import { GeneralStatus } from "@/types";

export default {
  props: {
    status: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const badgeClass = computed(() => {
      switch (props.status) {
        case GeneralStatus.Active:
          // css class for active status
          return "status-badge-active";
        case GeneralStatus.InActive:
          // css class for inactive status
          return "status-badge-inactive";
        default:
          return "";
      }
    });
    const textColor = computed(() => {
      switch (props.status) {
        case GeneralStatus.Active:
          // textColor for active status
          return "#333A47";
        case GeneralStatus.InActive:
          // textColor for inactive status
          return "#333A47";
        default:
          return "#333A47";
      }
    });
    const backGroundColor = computed(() => {
      switch (props.status) {
        case GeneralStatus.Active:
          // backGroundColor for active status
          return "#FFFFFF";
        case GeneralStatus.InActive:
          // backGroundColor for inactive status
          return "#FFFFFF";
        default:
          return "#FFFFFF";
      }
    });
    const iconColor = computed(() => {
      switch (props.status) {
        case GeneralStatus.Active:
          // iconColor for active status
          return "#16C92E";
        case GeneralStatus.InActive:
          // iconColor for inactive status
          return "#333A47";
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
