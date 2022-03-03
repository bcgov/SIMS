<template>
  <full-page-container>
    <formio formName="uploadStudentDocuments" @submitted="submitForm"></formio>
  </full-page-container>
</template>

<script lang="ts">
import formio from "@/components/generic/formio.vue";
import FullPageContainer from "@/components/layouts/FullPageContainer.vue";
import { useFormioUtils, useToastMessage } from "@/composables";
import { StudentFileUploaderForm, StudentFileUploaderDto } from "@/types";
import { StudentService } from "@/services/StudentService";

const APPLICATION_NOT_FOUND = "APPLICATION_NOT_FOUND";
export default {
  components: {
    formio,
    FullPageContainer,
  },
  setup() {
    const formioUtils = useFormioUtils();
    const toast = useToastMessage();
    const submitForm = async (
      submittedForm: StudentFileUploaderForm,
      form: any,
    ) => {
      try {
        const associatedFiles = formioUtils.getAssociatedFiles(form);
        const payload: StudentFileUploaderDto = {
          submittedForm,
          associatedFiles,
        };
        await StudentService.shared.saveStudentFiles(payload);
        //TODO: reset the form & code to refresh the page-after file listing is added
        toast.success(
          "Document Submitted",
          "Your documents have been submitted!",
        );
      } catch (error) {
        let errorLabel = "Unexpected error";
        let errorMessage = "An error happened while submitting your documents.";
        if (error.response.data?.errorType === APPLICATION_NOT_FOUND) {
          errorMessage = error.response.data.message;
          errorLabel = error.response.data.errorType;
        }
        toast.error(errorLabel, errorMessage);
      }
    };
    return { submitForm };
  },
};
</script>
