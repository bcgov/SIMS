<template>
  <v-alert :type="type" variant="outlined">
    <template #title>
      <div class="label-bold-normal">{{ header }}</div>
    </template>
    <v-row>
      <v-col sm="10" md="10" lg="10"
        ><div class="label-value-normal">{{ summary }}</div></v-col
      >
      <v-col sm="2" md="2" lg="2"><slot name="actions"></slot></v-col>
    </v-row>
  </v-alert>
</template>
<script lang="ts">
export default {
  props: {
    type: {
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
