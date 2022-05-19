<template>
  <v-alert :type="color" variant="outlined">
    <template v-slot:title>
      <div class="label-bold-normal">{{ header }}</div>
    </template>
    <v-row>
      <v-col cols="10"
        ><div class="float-left label-value-normal">{{ summary }}</div></v-col
      >
      <v-col cols="2"
        ><div class="pl-8">
          <slot name="actions"></slot></div
      ></v-col>
    </v-row>
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
