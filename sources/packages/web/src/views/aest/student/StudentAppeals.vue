<template>
  <PendingAppealsTable appeals-type="appeals" />
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
