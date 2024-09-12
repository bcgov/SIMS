<template>
  <full-page-container class="overflow-visible">
    <template #header
      ><header-navigator title="Institution" subTitle="Reports" />
    </template>
    <reports :report-list="INSTITUTION_REPORTS" />
  </full-page-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { INSTITUTION_REPORTS } from "@/constants";
import Reports from "@/components/common/Reports.vue";

export default defineComponent({
  components: {
    Reports,
  },
  setup() {
    return {
      INSTITUTION_REPORTS,
    };
  },
});
</script>
