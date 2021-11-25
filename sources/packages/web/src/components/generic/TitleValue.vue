<!--
Used when we need to display title and the value inside a container
-->
<template>
  <v-row class="mt-1 mb-2 ml-0">
    <span class="font-weight-bold">{{ propertyTitle }}</span>
  </v-row>
  <v-row class="mt-1 mb-2 ml-0">
    {{ propertyValue }}
  </v-row>
</template>

<script lang="ts">
export default {
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
};
</script>
