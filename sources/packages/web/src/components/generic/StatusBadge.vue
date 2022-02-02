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
      <span class="text-uppercase">{{ label }}</span>
    </template>
  </v-badge>
</template>
<script lang="ts">
import { ref, onMounted, watch } from "vue";
import { GeneralStatusForBadge } from "@/types";
import {
  COLOR_BLACK,
  COLOR_WHITE,
  COLOR_BANNER_SUCCESS,
  COLOR_BANNER_WARNING,
} from "@/constants";

export default {
  props: {
    status: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const label = ref("");
    const badgeClass = ref("");
    const textColor = ref(COLOR_BLACK);
    const backGroundColor = ref(COLOR_WHITE);
    const iconColor = ref("");

    const setStyles = () => {
      label.value = props.status;
      switch (props.status) {
        case GeneralStatusForBadge.Active:
        case GeneralStatusForBadge.ResolvedRestriction:
          // css class for active status
          badgeClass.value = "status-badge-success";
          textColor.value = COLOR_BLACK;
          backGroundColor.value = COLOR_WHITE;
          iconColor.value = COLOR_BANNER_SUCCESS;
          break;
        case GeneralStatusForBadge.InActive:
          // css class for inactive status
          badgeClass.value = "status-badge-inactive";
          textColor.value = COLOR_BLACK;
          backGroundColor.value = COLOR_WHITE;
          iconColor.value = COLOR_BLACK;
          break;
        case GeneralStatusForBadge.ActiveRestriction:
          // css class for active restriction status
          label.value = "active";
          badgeClass.value = "status-badge-warning";
          textColor.value = COLOR_BLACK;
          backGroundColor.value = COLOR_WHITE;
          iconColor.value = COLOR_BANNER_WARNING;
          break;
      }
    };
    watch(
      () => props.status,
      () => {
        setStyles();
      },
    );

    onMounted(() => {
      setStyles();
    });

    return {
      badgeClass,
      textColor,
      backGroundColor,
      iconColor,
      GeneralStatusForBadge,
      label,
    };
  },
};
</script>
