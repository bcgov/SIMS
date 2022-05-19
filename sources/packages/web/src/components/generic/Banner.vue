<template>
  <v-alert :class="getBackgroundClass" :type="color" variant="outlined">
    <template v-slot:title>
      <div class="label-bold-normal">{{ header }}</div>
    </template>
    <div class="label-value-normal w-75">{{ summary }}</div>
    <div class="float-right mt-n12">
      <slot name="actions"> </slot>
    </div>
  </v-alert>
</template>
<script lang="ts">
import { StatusChipTypes } from "@/components/generic/StatusChip.models";
import { computed } from "vue";

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
    const getBackgroundClass = computed(() => {
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
    });

    return { getBackgroundClass };
  },
};
</script>
