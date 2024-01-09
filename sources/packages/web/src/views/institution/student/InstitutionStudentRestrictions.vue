<template>
  <tab-container><student-restrictions :studentId="studentId" /></tab-container>
  <tab-container>
    <student-scholastic-standing-limited-history :studentId="studentId"
  /></tab-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import StudentRestrictions from "@/components/common/students/StudentRestrictions.vue";
import StudentScholasticStandingLimitedHistory from "@/components/common/students/StudentScholasticStandingLimitedHistory.vue";

export default defineComponent({
  components: { StudentRestrictions, StudentScholasticStandingLimitedHistory },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
});
</script>
