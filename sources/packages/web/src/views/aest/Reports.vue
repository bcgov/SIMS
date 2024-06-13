<template>
  <full-page-container class="overflow-visible">
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
      { description: "Data Inventory", id: "Data_Inventory_Report" },
      { description: "Disbursements", id: "Disbursement_Report" },
      { description: "eCert Errors", id: "ECert_Errors_Report" },
      {
        description: "Forecast disbursements",
        id: "Disbursement_Forecast_Report",
      },
      {
        description: "Institution Designation",
        id: "Institution_Designation_Report",
      },
      {
        description: "Program and Offering Status",
        id: "Program_And_Offering_Status_Report",
      },
    ];
    return { reportList };
  },
});
</script>
