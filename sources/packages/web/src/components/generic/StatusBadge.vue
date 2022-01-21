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
import "@/assets/css/global-style-variables.scss";

export default {
  props: {
    status: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const hexBrandBlack = "#333A47";
    const hexBrandWhite = "#FFFFFF";
    const label = ref("");
    const badgeClass = ref("");
    const textColor = ref(hexBrandBlack);
    const backGroundColor = ref(hexBrandWhite);
    const iconColor = ref("");
    const setGreen = () => {
      // css class for green status
      badgeClass.value = "status-badge-active";
      textColor.value = hexBrandBlack;
      backGroundColor.value = hexBrandWhite;
      iconColor.value = "#16C92E";
    };
    const setBlack = () => {
      // css class for black status
      badgeClass.value = "status-badge-inactive";
      textColor.value = hexBrandBlack;
      backGroundColor.value = hexBrandWhite;
      iconColor.value = hexBrandBlack;
    };
    const setOrange = () => {
      // css class for orange status
      badgeClass.value = "status-badge-warning";
      textColor.value = hexBrandBlack;
      backGroundColor.value = hexBrandWhite;
      iconColor.value = "#FF7a00";
    };
    const setRed = () => {
      // css class for red status
      badgeClass.value = "status-badge-denied";
      textColor.value = hexBrandBlack;
      backGroundColor.value = hexBrandWhite;
      iconColor.value = "#E4222E";
    };
    const setStyles = () => {
      label.value = props.status;
      switch (props.status) {
        case GeneralStatusForBadge.Active:
          setGreen();
          break;
        case GeneralStatusForBadge.Approved:
          setGreen();
          break;
        case GeneralStatusForBadge.ResolvedRestriction:
          setGreen();
          break;
        case GeneralStatusForBadge.InActive:
          setBlack();
          break;
        case GeneralStatusForBadge.ActiveRestriction:
          label.value = "active";
          setOrange();
          break;
        case GeneralStatusForBadge.Pending:
          setOrange();
          break;
        case GeneralStatusForBadge.Denied:
          setRed();
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
