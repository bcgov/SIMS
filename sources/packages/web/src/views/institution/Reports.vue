<template>
  <Reports title="Institution" :reportType="ReportTypes.InstitutionReport" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Reports from "@/components/common/Reports.vue";
import { ReportTypes } from "@/types/contracts/Reports";

export default defineComponent({
  components: {
    Reports,
  },
  setup() {
    return {
      ReportTypes,
    };
  },
});
</script>
