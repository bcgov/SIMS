<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator
        title="Student requests"
        subTitle="Appeals (2025-2026 and later)"
      />
    </template>
    <pending-appeals-table appeals-type="appeal" />
  </full-page-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PendingAppealsTable from "@/components/aest/student/PendingAppealsTable.vue";

export default defineComponent({
  components: {
    PendingAppealsTable,
  },
});
</script>
