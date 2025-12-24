<template>
  <tab-container :enable-card-view="false">
    <student-overaward-details
      :student-id="studentId"
      :show-added-by="true"
      :allow-manual-overaward="true"
    />
    <student-loan-balance-part-time :student-id="studentId" />
  </tab-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import StudentOverawardDetails from "@/components/common/StudentOverawardDetails.vue";
import StudentLoanBalancePartTime from "@/components/aest/students/StudentLoanBalancePartTime.vue";

export default defineComponent({
  components: { StudentOverawardDetails, StudentLoanBalancePartTime },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
});
</script>
