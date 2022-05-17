<template>
  <v-alert :type="bannerClass" variant="outlined">
    <v-row>
      <v-col cols="10">
        <div class="label-bold-normal">{{ header }}</div>
        <div class="label-value-normal">{{ summary }}</div>
      </v-col>
      <v-col cols="2">
        <div class="pt-4 pl-8"><slot name="actions"> </slot></div>
      </v-col>
    </v-row>
  </v-alert>
</template>
<script lang="ts">
export default {
  props: {
    bannerClass: {
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
