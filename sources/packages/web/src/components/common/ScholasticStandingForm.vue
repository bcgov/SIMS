<template>
  <formio
    formName="reportscholasticstandingchange"
    :data="initialData"
    :readOnly="true"
  ></formio>
</template>

<script lang="ts">
export default {
  props: {
    initialData: {
      type: Object,
      required: true,
    },
  },
};
</script>
