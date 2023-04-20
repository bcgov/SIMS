<template>
  <tab-container>
    <student-file-uploads
      :studentId="studentId"
      :canUploadFiles="true"
      :canDownloadFiles="true"
      @uploadFile="uploadFile"
    >
      <formio-modal-dialog
        ref="fileUploadModal"
        title="Upload file"
        :formData="initialData"
        formName="uploadStudentDocumentsAEST"
      >
        <template #actions="{ cancel, submit }">
          <v-row class="m-0 p-0">
            <v-btn color="primary" variant="outlined" @click="cancel"
              >Cancel</v-btn
            >
            <check-permission-role :role="Role.StudentUploadFile">
              <template #="{ notAllowed }">
                <v-btn
                  class="float-right"
                  @click="submit"
                  color="primary"
                  variant="elevated"
                  :disabled="notAllowed"
                  >Upload now</v-btn
                >
              </template>
            </check-permission-role>
          </v-row>
        </template>
      </formio-modal-dialog>
    </student-file-uploads>
  </tab-container>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useFormioUtils, useSnackBar, ModalDialog } from "@/composables";
import CheckPermissionRole from "@/components/generic/CheckPermissionRole.vue";
import { FormIOForm, Role } from "@/types";
import FormioModalDialog from "@/components/generic/FormioModalDialog.vue";
import StudentFileUploads from "@/components/common/students/StudentFileUploads.vue";
import { StudentService } from "@/services/StudentService";
import { AESTFileUploadToStudentAPIInDTO } from "@/services/http/dto/Student.dto";

export default defineComponent({
  components: { CheckPermissionRole, StudentFileUploads, FormioModalDialog },
  props: {
    studentId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const snackBar = useSnackBar();
    const formioUtils = useFormioUtils();
    const fileUploadModal = ref({} as ModalDialog<FormIOForm | boolean>);
    const initialData = ref({ studentId: props.studentId });

    const uploadFile = async (loadStudentFileUploads: () => void) => {
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
      Role,
      initialData,
      fileUploadModal,
    };
  },
});
</script>
