<!--
Used when we need to display title and the value inside a container
-->
<!-- TODO: Replace v-badge with vuetify2 equivalent v-chip with icon once veutify3 is released-->
<template>
  <v-badge
    color="green"
    content="&#10004;  {{designationStatus}}"
    location="top-right"
    text-color="white"
    ><template v-slot:default>
      <v-icon :size="25">mdi-map-markers-radius</v-icon>
    </template>
  </v-badge>
</template>
<script lang="ts">
export default {
  props: {
    designationStatus: {
      type: String,
      required: true,
    },
  },
};
</script>
