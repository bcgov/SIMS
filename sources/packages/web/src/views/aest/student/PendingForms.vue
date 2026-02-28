<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator title="Student requests" sub-title="Forms" />
    </template>
    <pending-forms-table />
  </full-page-container>
</template>

<script setup lang="ts">
import PendingFormsTable from "@/components/aest/student/PendingFormsTable.vue";
</script>
