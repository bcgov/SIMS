<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator title="Student requests" sub-title="Forms" />
    </template>
    <form-submission-pending-forms-table />
  </full-page-container>
</template>

<script setup lang="ts">
import FormSubmissionPendingFormsTable from "@/components/aest/student/FormSubmissionPendingFormsTable.vue";
</script>
