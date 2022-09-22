<template>
  <span
    v-for="([headerKey, headerValue], index) in Object.entries(headerMap)"
    :key="headerKey"
  >
    <span class="label-bold-normal">{{ headerKey }} : </span>
    <span class="label-value-normal"> {{ headerValue }} </span>
    <!-- TODO: v-divider vertical must be used here once Vuetify 3 vertical divider is working.  -->
    <span
      v-if="index < Object.entries(headerMap).length - 1"
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
      required: true,
    },
  },
};
</script>
