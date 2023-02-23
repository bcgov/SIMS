<template>
  <p class="header-sub-title mt-9">Overawards</p>
  <student-overaward-details
    :studentId="studentId"
    :showAddedBy="true"
    :allowManualOverawardDeduction="true"
  />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import StudentOverawardDetails from "@/components/common/StudentOverawardDetails.vue";

export default defineComponent({
  components: { StudentOverawardDetails },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
});
</script>
