<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator title="Student requests" sub-title="All appeals" />
    </template>
    <pending-all-appeals-table />
  </full-page-container>
</template>

<script setup lang="ts">
import PendingAllAppealsTable from "@/components/aest/student/PendingAllAppealsTable.vue";
</script>
