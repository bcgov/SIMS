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
import { ref, onMounted } from "vue";
import { GeneralStatus } from "@/types";

export default {
  props: {
    status: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const badgeClass = ref("");
    const textColor = ref("#333A47");
    const backGroundColor = ref("#FFFFFF");
    const iconColor = ref("");

    const setStyles = () => {
      switch (props.status) {
        case GeneralStatus.Active:
          // css class for active status
          badgeClass.value = "status-badge-active";
          textColor.value = "#333A47";
          backGroundColor.value = "#FFFFFF";
          iconColor.value = "#16C92E";
          break;
        case GeneralStatus.InActive:
          // css class for inactive status
          badgeClass.value = "status-badge-inactive";
          textColor.value = "#333A47";
          backGroundColor.value = "#FFFFFF";
          iconColor.value = "#333A47";
          break;
      }
    };
    onMounted(() => {
      setStyles();
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
