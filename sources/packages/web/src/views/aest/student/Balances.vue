<template>
  <tab-container :enableCardView="false">
    <student-overaward-details
      :studentId="studentId"
      :showAddedBy="true"
      :allowManualOverawardDeduction="true"
    />
  </tab-container>
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
