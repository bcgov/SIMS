<template>
  <v-alert :class="getBackgroundClass()" :type="color" variant="outlined">
    <v-row>
      <v-col cols="10">
        <div class="label-bold-normal">{{ header }}</div>
        <div class="label-value-normal">{{ summary }}</div>
      </v-col>
      <v-col cols="2">
        <div class="pt-4 pl-2"><slot name="actions"> </slot></div>
      </v-col>
    </v-row>
  </v-alert>
</template>
<script lang="ts">
import { StatusChipTypes } from "@/components/generic/StatusChip.models";

export default {
  props: {
    color: {
      type: String,
    },
    header: {
      type: String,
    },
    summary: {
      type: String,
    },
  },
  setup(props: any) {
    const getBackgroundClass = () => {
      switch (props.color) {
        case StatusChipTypes.Success:
          return "v-alert-background-success";
        case StatusChipTypes.Warning:
          return "v-alert-background-warning";
        case StatusChipTypes.Error:
          return "v-alert-background-error";
        default:
          return "";
      }
    };
    return { getBackgroundClass };
  },
};
</script>
