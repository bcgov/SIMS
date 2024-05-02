<template>
  <full-page-container>
    <template #header
      ><header-navigator title="Institution" subTitle="Reports" />
    </template>
    <Reports title="Institution" :reportList="reportList" />
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
    ];
    return {
      reportList,
    };
  },
});
</script>
