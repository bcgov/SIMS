<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator title="Student requests" sub-title="Appeals" />
    </template>
    <form-submission-pending-appeals-table />
  </full-page-container>
</template>

<script setup lang="ts">
import FormSubmissionPendingAppealsTable from "@/components/aest/student/FormSubmissionPendingAppealsTable.vue";
</script>
