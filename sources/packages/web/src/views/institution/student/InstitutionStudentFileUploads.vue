<template>
  <tab-container>
    <student-file-uploads :studentId="studentId"></student-file-uploads>
  </tab-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import StudentFileUploads from "@/components/common/students/StudentFileUploads.vue";

export default defineComponent({
  components: { StudentFileUploads },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
});
</script>
