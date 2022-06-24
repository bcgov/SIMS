<template>
  <full-page-container>
    <template #header>
      <header-navigator title="Students" subTitle="Exceptions" />
    </template>

    <student-application-exceptions-summary />
  </full-page-container>
</template>

<script lang="ts">
import StudentApplicationExceptionsSummary from "@/components/aest/students/exception/StudentApplicationExceptionsSummary.vue";

export default {
  components: { StudentApplicationExceptionsSummary },
};
</script>
