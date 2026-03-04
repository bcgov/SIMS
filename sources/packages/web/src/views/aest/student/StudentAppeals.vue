<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator title="Student requests" sub-title="All appeals" />
    </template>
    <pending-appeals-table />
  </full-page-container>
</template>

<script setup lang="ts">
import PendingAppealsTable from "@/components/aest/student/PendingAppealsTable.vue";
</script>
