<template>
  <v-alert :type="color" variant="contained-text">
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
};
</script>
