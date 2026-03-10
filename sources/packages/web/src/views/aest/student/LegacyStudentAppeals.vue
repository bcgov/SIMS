<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator
        title="Student requests"
        sub-title="Appeals (2025-2026 and later)"
      />
    </template>
    <legacy-pending-appeals-table :appeals-type="AppealType.Appeal" />
  </full-page-container>
</template>

<script setup lang="ts">
import { AppealType } from "@/types";
import LegacyPendingAppealsTable from "@/components/aest/students/LegacyPendingAppealsTable.vue";
</script>
