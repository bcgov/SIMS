<template>
  <span v-for="([key, value], index) in headerMap" :key="key">
    <span class="label-bold-normal">{{ key }} : </span>
    <span class="label-value-normal"> {{ value }} </span>
    <span v-if="index < headerMap.size - 1" class="mx-2 vertical-divider" />
  </span>
</template>

<script lang="ts">
import { PropType } from "vue";

export default {
  props: {
    headerMap: {
      type: Object as PropType<Map<string, string>>,
      required: false,
      default: new Map<string, string>(),
    },
  },
};
</script>
