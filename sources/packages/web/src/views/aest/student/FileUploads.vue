<template>
  <tab-container>
    <student-file-uploads
      :student-id="studentId"
      :can-upload-files="true"
      :can-download-files="true"
      :can-view-uploaded-by="true"
      :can-delete-files="true"
      @upload-file="uploadFile"
    >
    </student-file-uploads>
  </tab-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useSnackBar } from "@/composables";
import StudentFileUploads from "@/components/common/students/StudentFileUploads.vue";
import { StudentService } from "@/services/StudentService";
import { AESTFileUploadToStudentAPIInDTO } from "@/services/http/dto/Student.dto";

export default defineComponent({
  components: { StudentFileUploads },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const snackBar = useSnackBar();

    const uploadFile = async (
      associatedFiles: string[],
      loadStudentFileUploads: () => void,
    ) => {
      try {
        const payload: AESTFileUploadToStudentAPIInDTO = {
          associatedFiles,
        };
        await StudentService.shared.saveAESTUploadedFilesToStudent(
          props.studentId,
          payload,
        );
        snackBar.success(
          "The documents were submitted and a notification was sent to the student.",
        );
        loadStudentFileUploads();
      } catch {
        snackBar.error("An unexpected error happened.");
      }
    };
    return {
      uploadFile,
    };
  },
});
</script>
