<template>
  <full-page-container class="overflow-visible">
    <template #header
      ><header-navigator title="Institution" subTitle="Reports" />
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
        description: "Offering Details",
        id: "Offering_Details_Report",
      },
      { description: "Student Unmet Need", id: "Student_Unmet_Need_Report" },
    ];
    return {
      reportList,
    };
  },
});
</script>
