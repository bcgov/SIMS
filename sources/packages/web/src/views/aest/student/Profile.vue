<template>
  <tab-container>
    <student-profile
      :studentId="studentId"
      :allowDisabilityStatusUpdate="true"
      :showLegacyMatch="true"
    />
  </tab-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import StudentProfile from "@/components/common/students/StudentProfile.vue";

export default defineComponent({
  components: { StudentProfile },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
});
</script>
