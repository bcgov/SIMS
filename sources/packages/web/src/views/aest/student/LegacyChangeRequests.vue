<template>
  <full-page-container :full-width="true">
    <template #header>
      <header-navigator
        title="Student requests"
        subTitle="Change Requests (Pre 2025-2026)"
      />
    </template>
    <PendingAppealsTable appeals-type="leagacy-change-requests" />
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
