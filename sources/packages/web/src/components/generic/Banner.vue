<template>
  <v-banner lines="two" :class="bannerClass">
    <v-banner-icon><slot name="icon"> </slot></v-banner-icon>

    <v-banner-text :style="{ display: 'block' }"
      ><div class="label-bold">{{ header }}</div>
      <div>{{ summary }}</div>
    </v-banner-text>

    <div class="ml-8 mt-2" :style="{ display: 'inline-flex' }">
      <slot name="actions"> </slot>
    </div>
  </v-banner>
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
