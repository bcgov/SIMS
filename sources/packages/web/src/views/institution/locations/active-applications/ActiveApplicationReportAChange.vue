<template>
  <Card class="p-m-4">
    <template #content>
      <formio :formName="reportachange" :data="initialData"></formio>
      <h1 class="d-flex justify-content-center">
        Application # {{ applicationId }} - Work in Progress
      </h1>
    </template>
  </Card>
</template>
<script lang="ts">
export default {
  props: {
    applicationId: {
      type: Number,
      required: true,
    },
    locationId: {
      type: Number,
      required: true,
    },
  },
};
</script>
