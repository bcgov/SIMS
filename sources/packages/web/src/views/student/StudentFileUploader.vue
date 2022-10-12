<template>
  <student-page-container layout-template="centered">
    <template #header>
      <header-navigator title="Student" subTitle="File uploader" />
    </template>
    <v-row>
      <v-col>
        <v-card>
          <v-container>
            <!-- todo: ann form definition and btn -->
            <formio-container
              formName="uploadStudentDocuments"
              @submitted="submitForm"
            />
          </v-container>
        </v-card>
      </v-col>
      <v-col md="5">
        <student-document-list :reload="reloadDocuments" />
      </v-col>
    </v-row>
  </student-page-container>
</template>

<script lang="ts">
import { useFormioUtils, useSnackBar } from "@/composables";
import { StudentService } from "@/services/StudentService";
import StudentDocumentList from "@/components/students/StudentDocumentList.vue";
import { ref } from "vue";
import {
  StudentFileUploaderAPIInDTO,
  StudentFileUploaderInfoAPIInDTO,
} from "@/services/http/dto/Student.dto";

const APPLICATION_NOT_FOUND = "APPLICATION_NOT_FOUND";
export default {
  components: {
    StudentDocumentList,
  },
  setup() {
    const reloadDocuments = ref(false);
    const formioUtils = useFormioUtils();
    const snackBar = useSnackBar();
    const submitForm = async (
      submittedForm: StudentFileUploaderInfoAPIInDTO,
      form: any,
    ) => {
      try {
        const associatedFiles = formioUtils.getAssociatedFiles(form);
        const payload: StudentFileUploaderAPIInDTO = {
          submittedForm,
          associatedFiles,
        };
        await StudentService.shared.saveStudentFiles(payload);
        // form reset and document list reload
        form.submission = {};
        reloadDocuments.value = !reloadDocuments.value;
        snackBar.success("Your documents have been submitted!");
      } catch (error) {
        let errorMessage = "An error happened while submitting your documents.";
        if (error.response.data?.errorType === APPLICATION_NOT_FOUND) {
          errorMessage = error.response.data.message;
        }
        snackBar.error(errorMessage);
      }
    };
    return { submitForm, reloadDocuments };
  },
};
</script>
