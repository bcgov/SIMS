<template>
  <v-chip class="ma-1" :color="color" size="small" variant="outlined">
    {{ label }}
  </v-chip>
</template>
<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    color: {
      type: String,
      required: false,
      default: undefined,
    },
    label: {
      type: String,
      required: true,
    },
  },
});
</script>
