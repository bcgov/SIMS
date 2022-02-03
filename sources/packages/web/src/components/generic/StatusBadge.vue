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
    const setGreen = () => {
      // css class for green status
      badgeClass.value = "status-badge-success";
      textColor.value = COLOR_BLACK;
      backGroundColor.value = COLOR_WHITE;
      iconColor.value = COLOR_BANNER_SUCCESS;
    };
    const setBlack = () => {
      // css class for black status
      badgeClass.value = "status-badge-inactive";
      textColor.value = COLOR_BLACK;
      backGroundColor.value = COLOR_WHITE;
      iconColor.value = COLOR_BLACK;
    };
    const setOrange = () => {
      // css class for orange status
      badgeClass.value = "status-badge-warning";
      textColor.value = COLOR_BLACK;
      backGroundColor.value = COLOR_WHITE;
      iconColor.value = COLOR_BANNER_WARNING;
    };
    const setStyles = () => {
      label.value = props.status;
      switch (props.status) {
        case GeneralStatusForBadge.Active:
          setGreen();
          break;
        case GeneralStatusForBadge.ResolvedRestriction:
          setGreen();
          break;
        case GeneralStatusForBadge.InActive:
          // css class for inactive status
          setBlack();
          break;
        case GeneralStatusForBadge.ActiveRestriction:
          label.value = "active";
          setOrange();
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
