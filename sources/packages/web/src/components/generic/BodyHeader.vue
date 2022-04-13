<template>
  <div class="mb-4">
    <span class="category-header-large color-blue">
      {{ fullTitleMessage }}
    </span>
    <span class="ml-2">
      <slot name="status-chip"></slot>
    </span>
    <div class="float-right">
      <slot name="actions"></slot>
    </div>
    <div class="mt-1">
      {{ subTitle }}
    </div>
  </div>
</template>

<script lang="ts">
import { computed } from "vue";
export default {
  props: {
    title: {
      type: String,
      required: true,
    },
    subTitle: {
      type: String,
      required: false,
    },
    recordsCount: {
      type: Number,
      required: false,
    },
  },
  setup(props: any) {
    const fullTitleMessage = computed(() => {
      if (props.recordsCount) {
        return `${props.title} (${props.recordsCount})`;
      }
      return props.title;
    });
    return { fullTitleMessage };
  },
};
</script>
