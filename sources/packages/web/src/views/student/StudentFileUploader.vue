<template>
  <full-page-container>
    <formio formName="uploadStudentDocuments"></formio>
  </full-page-container>
</template>

<script lang="ts">
import formio from "@/components/generic/formio.vue";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
export default {
  components: {
    formio,
    FullPageContainer,
  },
};
</script>
