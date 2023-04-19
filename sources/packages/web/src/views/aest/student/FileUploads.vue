<template>
  <tab-container>
    <student-file-uploads
      :studentId="studentId"
      :canUploadFiles="true"
      :canDownloadFiles="true"
      :studentFileUploads="studentFileUploads"
      @loaded="loadStudentFileUploads"
    ></student-file-uploads>
  </tab-container>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import StudentFileUploads from "@/components/common/students/StudentFileUploads.vue";
import { StudentService } from "@/services/StudentService";
import { StudentUploadFileAPIOutDTO } from "@/services/http/dto/Student.dto";

export default defineComponent({
  components: { StudentFileUploads },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup() {
    const studentFileUploads = ref([] as StudentUploadFileAPIOutDTO[]);
    const loadStudentFileUploads = async (studentId: number) => {
      studentFileUploads.value =
        await StudentService.shared.getAESTStudentFiles(studentId);
    };
    return { loadStudentFileUploads, studentFileUploads };
  },
});
</script>
