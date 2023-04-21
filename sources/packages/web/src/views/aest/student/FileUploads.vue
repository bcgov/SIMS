<template>
  <tab-container>
    <student-file-uploads
      :studentId="studentId"
      :canUploadFiles="true"
      :canDownloadFiles="true"
      @uploadFile="uploadFile"
    >
    </student-file-uploads>
  </tab-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useFormioUtils, useSnackBar } from "@/composables";
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
    const formioUtils = useFormioUtils();

    const uploadFile = async (
      fileUploadModal,
      loadStudentFileUploads: () => void,
    ) => {
      const modalResult = await fileUploadModal.value.showModal();
      if (!modalResult) {
        return;
      }

      try {
        const associatedFiles = formioUtils.getAssociatedFiles(modalResult);
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
