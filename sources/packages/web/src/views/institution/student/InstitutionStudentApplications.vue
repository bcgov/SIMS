<template>
  <tab-container>
    <student-applications :studentId="studentId" />
  </tab-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import StudentApplications from "@/components/common/students/StudentApplications.vue";

export default defineComponent({
  components: { StudentApplications },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
});
</script>
