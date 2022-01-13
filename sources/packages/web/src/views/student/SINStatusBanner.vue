<template>
  <Message :severity="severity">
    {{ message }}
  </Message>
</template>
<script lang="ts">
export default {
  props: {
    message: {
      type: String,
    },
    severity: {
      type: String,
    },
  },
};
</script>
