<!--
Used when we need to display the designation status for an Institution
-->
<template>
  <v-badge :color="color" text-color="white">
    <template v-slot:badge>
      <font-awesome-icon :icon="icon" class="mx-1 my-1" />
      <span class="text-uppercase">{{ label }}</span>
    </template>
  </v-badge>
</template>
<script lang="ts">
import { onMounted, ref, watch } from "vue";
import { DesignationAndRestrictionStatus } from "@/types";

export default {
  props: {
    status: {
      type: String,
      required: true,
    },
  },
  setup(props: any) {
    const icon = ref();
    const label = ref();
    const color = ref();

    const setIcons = () => {
      label.value = props.status;
      switch (props.status) {
        case DesignationAndRestrictionStatus.designated:
          icon.value = "check";
          color.value = "#16C92E";
          break;
        case DesignationAndRestrictionStatus.noRestriction:
          icon.value = "check";
          label.value = "";
          color.value = "#16C92E";
          break;
        case DesignationAndRestrictionStatus.restriction:
          icon.value = "times";
          label.value = "ACTIVE RESTRICTIONS";
          color.value = "#FFAD00";
          break;
      }
    };
    watch(
      () => props.status,
      () => {
        setIcons();
      },
    );

    onMounted(() => {
      setIcons();
    });

    return {
      icon,
      label,
      color,
    };
  },
};
</script>
