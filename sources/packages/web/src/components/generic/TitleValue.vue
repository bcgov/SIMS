<!--
Used when we need to display title and the value inside a container
-->
<template>
  <div class="mb-2">
    <span class="label-bold">{{ propertyTitle }}</span>
  </div>
  <div class="mb-2 label-value muted-content">
    {{ propertyValue }}
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  props: {
    propertyTitle: {
      type: String,
      required: true,
    },
    propertyValue: {
      type: String,
      required: true,
    },
  },
});
</script>
