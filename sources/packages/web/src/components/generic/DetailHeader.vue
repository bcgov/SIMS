<template>
  <div
    class="d-flex flex-column flex-lg-row flex-wrap align-start align-lg-center"
  >
    <span
      v-for="([headerKey, headerValue], index) in headerEntries"
      :key="headerKey"
      class="d-inline-flex align-baseline"
    >
      <span class="label-bold-normal ml-2 ml-lg-0 pr-2 text-no-wrap"
        >{{ headerKey }}:</span
      >
      <span class="label-value-normal d-inline-block text-truncate" :title="headerValue">
        {{ headerValue }}
      </span>
      <span
        v-if="index < headerEntries.length - 1"
        class="d-none d-lg-inline mx-1 brand-gray-text"
        >|</span
      >
    </span>
  </div>
</template>

<script setup lang="ts">
import { PropType, computed } from "vue";

const props = defineProps({
  headerMap: {
    type: Object as PropType<Record<string, string | undefined>>,
    required: true,
  },
});
const headerEntries = computed(() =>
  Object.entries(props.headerMap).filter(([, headerValue]) => !!headerValue),
);
</script>
