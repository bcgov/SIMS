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
    const textColor = ref("#333A47");
    const backGroundColor = ref("#FFFFFF");
    const iconColor = ref("");

    const setStyles = () => {
      label.value = props.status;
      switch (props.status) {
        case GeneralStatusForBadge.Active:
        case GeneralStatusForBadge.ResolvedRestriction:
          // css class for active status
          badgeClass.value = "status-badge-active";
          textColor.value = "#333A47";
          backGroundColor.value = "#FFFFFF";
          iconColor.value = "#16C92E";
          break;
        case GeneralStatusForBadge.InActive:
          // css class for inactive status
          badgeClass.value = "status-badge-inactive";
          textColor.value = "#333A47";
          backGroundColor.value = "#FFFFFF";
          iconColor.value = "#333A47";
          break;
        case GeneralStatusForBadge.ActiveRestriction:
          // css class for active restriction status
          label.value = "active";
          badgeClass.value = "status-badge-active-restriction";
          textColor.value = "#333A47";
          backGroundColor.value = "#FFFFFF";
          iconColor.value = "#FF7a00";
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
