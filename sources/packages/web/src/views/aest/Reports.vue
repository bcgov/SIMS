<template>
  <full-page-container class="overflow-visible">
    <template #header
      ><header-navigator title="Ministry" subTitle="Reports" />
    </template>
    <reports :report-list="MINISTRY_REPORTS" />
  </full-page-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { MINISTRY_REPORTS } from "@/constants";
import Reports from "@/components/common/Reports.vue";

export default defineComponent({
  components: {
    Reports,
  },
  setup() {
    return { MINISTRY_REPORTS };
  },
});
</script>
