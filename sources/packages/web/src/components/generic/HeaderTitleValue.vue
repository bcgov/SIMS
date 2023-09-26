<!--
Used when we need to display header title and the value
-->
<template>
  <div>
    <v-icon
      v-if="iconLabel"
      class="mr-2"
      :icon="iconLabel"
      size="20"
      :color="iconColor"
    />
    <span class="label-bold-normal">{{ title }}: </span>
    <slot name="value">
      <span class="label-value-normal"> {{ value }} </span>
    </slot>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  props: {
    iconLabel: { type: String, required: false },
    iconColor: { type: String, required: false },
    title: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: false,
    },
  },
});
</script>
