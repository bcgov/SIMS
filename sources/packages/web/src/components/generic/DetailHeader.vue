<template>
  <span
    v-for="([headerKey, headerValue], index) in headerEntries"
    :key="headerKey"
  >
    <span class="label-bold-normal">{{ headerKey }}: </span>
    <span class="label-value-normal"> {{ headerValue }} </span>
    <span v-if="index < headerEntries.length - 1" class="mx-1 brand-gray-text"
      >|</span
    >
  </span>
</template>

<script lang="ts">
import { PropType, computed, defineComponent } from "vue";

export default defineComponent({
  props: {
    headerMap: {
      type: Object as PropType<Record<string, string | undefined>>,
      required: true,
    },
  },
  setup(props) {
    const headerEntries = computed(() =>
      Object.entries(props.headerMap).filter(
        ([, headerValue]) => !!headerValue,
      ),
    );
    return { headerEntries };
  },
});
</script>
