<template>
  <div class="d-flex flex-column flex-md-row">
    <span
      v-for="([headerKey, headerValue], index) in headerEntries"
      :key="headerKey"
      class="d-inline-flex"
    >
      <span class="label-bold-normal ml-2 and ml-md-0"
        >{{ headerKey }}:&nbsp;</span
      >
      <span class="label-value-normal">{{ headerValue }}</span>
      <span
        v-if="index < headerEntries.length - 1"
        class="d-none d-md-inline mx-1 brand-gray-text"
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
