<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator
        title="Student requests"
        sub-title="Change Requests (Pre 2025-2026)"
      />
    </template>
    <legacy-pending-appeals-table appeals-type="legacy-change-request" />
  </full-page-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import LegacyPendingAppealsTable from "@/components/aest/students/LegacyPendingAppealsTable.vue";

export default defineComponent({
  components: {
    LegacyPendingAppealsTable,
  },
});
</script>
