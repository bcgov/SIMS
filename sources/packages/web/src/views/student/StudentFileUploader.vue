<template>
  <v-container>
    <header-navigator title="Student" subTitle="File uploader" />
    <div class="row">
      <div class="col-xs-6 col-md-7">
        <full-page-container>
          <formio
            formName="uploadStudentDocuments"
            @submitted="submitForm"
          ></formio>
        </full-page-container>
      </div>
      <div class="col-xs-5 col-md-5">
        <StudentDocumentList :reload="reloadDocuments" />
      </div>
    </div>
  </v-container>
</template>

<script lang="ts">
import { useFormioUtils, useToastMessage } from "@/composables";
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
    const toast = useToastMessage();
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
        toast.success(
          "Document Submitted",
          "Your documents have been submitted!",
        );
      } catch (error) {
        let errorMessage = "An error happened while submitting your documents.";
        if (error.response.data?.errorType === APPLICATION_NOT_FOUND) {
          errorMessage = error.response.data.message;
        }
        toast.error("Unexpected error", errorMessage);
      }
    };
    return { submitForm, reloadDocuments };
  },
};
</script>
