<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator
        title="Student requests"
        sub-title="Change Requests (Pre 2025-2026)"
      />
    </template>
    <legacy-pending-appeals-table
      :appeals-type="AppealType.LegacyChangeRequest"
    />
  </full-page-container>
</template>

<script setup lang="ts">
import { AppealType } from "@/types";
import LegacyPendingAppealsTable from "@/components/aest/students/LegacyPendingAppealsTable.vue";
</script>
