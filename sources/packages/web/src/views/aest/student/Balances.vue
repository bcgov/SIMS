<template>
  <tab-container :enableCardView="false">
    <student-overaward-details
      :studentId="studentId"
      :showAddedBy="true"
      :allowManualOverawardDeduction="true"
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
