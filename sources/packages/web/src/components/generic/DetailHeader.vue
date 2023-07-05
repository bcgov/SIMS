<template>
  <span
    v-for="([headerKey, headerValue], index) in Object.entries(headerMap)"
    :key="headerKey"
  >
    <span class="label-bold-normal">{{ headerKey }}: </span>
    <span class="label-value-normal"> {{ headerValue }} </span>
    <span
      v-if="index < Object.entries(headerMap).length - 1"
      class="mx-1 brand-gray-text"
      >|</span
    >
  </span>
</template>

<script lang="ts">
import { PropType, defineComponent } from "vue";

export default defineComponent({
  props: {
    headerMap: {
      type: Object as PropType<Record<string, string>>,
      required: true,
    },
  },
});
</script>
