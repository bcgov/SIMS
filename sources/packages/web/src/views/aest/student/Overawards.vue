<template>
  <div class="mt-9">
    <p class="header-sub-title">Overawards</p>
    <student-overaward-details
      :studentId="studentId"
      :showAddedBy="true"
      :allowManualOverawardDeduction="true"
    />
  </div>
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
