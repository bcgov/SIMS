<template>
  <Message severity="error">
    {{ restrictionMessage }}
  </Message>
</template>
<script lang="ts">
export default {
  props: {
    restrictionMessage: {
      type: String,
    },
  },
};
</script>
