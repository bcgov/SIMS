<template>
  <full-page-container>
    <template #header
      ><header-navigator title="Ministry" subTitle="Reports" />
    </template>
    <reports :report-list="reportList" />
  </full-page-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Reports from "@/components/common/Reports.vue";

export default defineComponent({
  components: {
    Reports,
  },
  setup() {
    const reportList = [
      {
        description: "Forecast disbursements",
        id: "Disbursement_Forecast_Report",
      },
      { description: "Disbursements", id: "Disbursement_Report" },
      { description: "Data Inventory", id: "Data_Inventory_Report" },
    ];
    return { reportList };
  },
});
</script>
