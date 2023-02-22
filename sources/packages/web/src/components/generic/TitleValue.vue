<!--
Used when we need to display title and the value inside a container
-->
<template>
  <div class="mb-2">
    <slot name="title">
      <span class="label-bold">{{ propertyTitle }}</span>
    </slot>
  </div>
  <div class="mb-2 label-value muted-content">
    {{ propertyValue }}
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  props: {
    propertyValue: {
      type: String,
      required: true,
    },
    propertyTitle: {
      type: String,
      required: false,
    },
  },
});
</script>
