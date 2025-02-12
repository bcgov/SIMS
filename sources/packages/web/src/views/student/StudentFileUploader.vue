<template>
  <student-page-container layout-template="centered">
    <template #header>
      <header-navigator title="Student" subTitle="File uploader" />
    </template>
    <v-row>
      <v-col>
        <v-card>
          <v-container>
            <formio-container
              formName="uploadStudentDocuments"
              @submitted="submitForm"
            >
              <template #actions="{ submit }">
                <footer-buttons
                  :processing="processing"
                  @primaryClick="submit"
                  primary-label="Submit documents"
                  :show-secondary-button="false"
                /> </template
            ></formio-container>
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
import { ref, defineComponent } from "vue";
import {
  StudentFileUploaderAPIInDTO,
  StudentFileUploaderInfoAPIInDTO,
} from "@/services/http/dto/Student.dto";
import { ApiProcessError, FormIOForm } from "@/types";

const APPLICATION_NOT_FOUND = "APPLICATION_NOT_FOUND";
export default defineComponent({
  components: {
    StudentDocumentList,
  },
  setup() {
    const reloadDocuments = ref(false);
    const formioUtils = useFormioUtils();
    const { excludeExtraneousValues } = useFormioUtils();
    const snackBar = useSnackBar();
    const processing = ref(false);

    const submitForm = async (
      form: FormIOForm<StudentFileUploaderInfoAPIInDTO>,
    ) => {
      try {
        processing.value = true;
        const submittedForm = excludeExtraneousValues(
          StudentFileUploaderInfoAPIInDTO,
          form.data,
        );
        const associatedFiles = formioUtils.getAssociatedFiles(form);
        const payload: StudentFileUploaderAPIInDTO = {
          submittedForm,
          associatedFiles,
        };
        await StudentService.shared.saveStudentFiles(payload);
        // Form reset and document list reload.
        await form.resetValue();
        form.redraw();
        reloadDocuments.value = !reloadDocuments.value;
        snackBar.success("Your documents have been submitted!");
      } catch (error: unknown) {
        let errorMessage = "An error happened while submitting your documents.";
        if (error instanceof ApiProcessError) {
          if (error.errorType === APPLICATION_NOT_FOUND) {
            errorMessage = error.message;
          }
        }
        snackBar.error(errorMessage);
      } finally {
        processing.value = false;
      }
    };

    return { submitForm, reloadDocuments, processing };
  },
});
</script>
