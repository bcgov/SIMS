<template>
  <span v-for="(headerName, index) in Object.keys(headerMap)" :key="headerName">
    <span class="label-bold-normal">{{ headerName }} : </span>
    <span class="label-value-normal"> {{ headerMap[headerName] }} </span>
    <!-- TODO: v-divider vertical must be used here once Vuetify 3 vertical divider is working.  -->
    <span
      v-if="index < Object.keys(headerMap).length - 1"
      class="mx-2 vertical-divider"
    />
  </span>
</template>

<script lang="ts">
import { PropType } from "vue";

export default {
  props: {
    headerMap: {
      type: Object as PropType<Record<string, string>>,
      required: false,
      default: {} as Record<string, string>,
    },
  },
};
</script>
