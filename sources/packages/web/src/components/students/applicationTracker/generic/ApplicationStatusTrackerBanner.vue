<template>
  <content-group> hello</content-group>
</template>
<script lang="ts">
export default {
  props: {
    label: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
};
</script>
