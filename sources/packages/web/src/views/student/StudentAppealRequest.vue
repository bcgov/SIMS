<template>
  <student-page-container class="overflow-visible">
    <template #header>
      <header-navigator title="Student" subTitle="Request a Change" />
    </template>

    <div v-if="showRequestForAppeal">
      <!-- Content area. -->
      <formio-container
        formName="studentRequestChange"
        @submitted="submitRequest"
      >
        <template #actions="{ submit }">
          <v-btn @click="submit" color="primary" class="float-right">
            Next
          </v-btn>
        </template>
      </formio-container>
    </div>
    <div v-else>
      <body-header
        title="Fill in the field(s) below"
        subTitle="StudentAid BC will review your application change after you submit the fields below."
      ></body-header>
      <appeal-requests-form
        :student-appeal-requests="appealRequestsForms"
        @submitted="submitAppeal"
      >
        <template #actions="{ submit }">
          <v-btn
            color="primary"
            variant="outlined"
            class="mr-2"
            @click="backToRequestForm"
            >Back
          </v-btn>

          <v-btn
            color="primary"
            class="ml-2 float-right"
            @click="submit"
            :loading="processing"
            >Submit for review</v-btn
          >
        </template>
      </appeal-requests-form>
    </div>
  </student-page-container>
</template>
<script lang="ts">
import { computed, ref, defineComponent } from "vue";
import { ApiProcessError, FormIOForm, StudentAppealRequest } from "@/types";
import { ApplicationService } from "@/services/ApplicationService";
import { StudentAppealService } from "@/services/StudentAppealService";
import AppealRequestsForm from "@/components/common/AppealRequestsForm.vue";
import { useSnackBar } from "@/composables";
import {
  APPLICATION_CHANGE_NOT_ELIGIBLE,
  APPLICATION_HAS_PENDING_APPEAL,
  INVALID_APPLICATION_NUMBER,
} from "@/constants";

// Model for student request change form.
interface StudentRequestSelectedForms {
  applicationNumber: string;
  formNames: string[];
}

export default defineComponent({
  components: {
    AppealRequestsForm,
  },
  setup() {
    const snackBar = useSnackBar();
    const processing = ref(false);
    const appealRequestsForms = ref([] as StudentAppealRequest[]);
    let applicationId: number;
    const showRequestForAppeal = computed(
      () => appealRequestsForms.value.length === 0,
    );

    const submitRequest = async (
      form: FormIOForm<StudentRequestSelectedForms>,
    ) => {
      try {
        const application =
          await ApplicationService.shared.getApplicationForRequestChange(
            form.data.applicationNumber,
          );
        applicationId = application.id;
        appealRequestsForms.value = form.data.formNames.map(
          (formName) =>
            ({
              formName,
              data: { programYear: application.programYear },
            } as StudentAppealRequest),
        );
      } catch (error: unknown) {
        const errorMessage = "An error happened while requesting a change.";
        const errorLabel = "Unexpected error";
        if (error instanceof ApiProcessError) {
          if (error.errorType === INVALID_APPLICATION_NUMBER) {
            snackBar.warn(`Application not found. ${error.message}`);
            return;
          }
          snackBar.error(`${errorLabel}. ${errorMessage}`);
        }
      }
    };
    const backToRequestForm = () => {
      appealRequestsForms.value = [];
    };

    const submitAppeal = async (appealRequests: StudentAppealRequest[]) => {
      try {
        processing.value = true;
        await StudentAppealService.shared.submitStudentAppeal(
          applicationId,
          appealRequests,
        );
        snackBar.success(
          "The request for change has been submitted successfully.",
        );
        //TODO: Redirect to appeal view page once it is developed.
        backToRequestForm();
      } catch (error: unknown) {
        if (error instanceof ApiProcessError) {
          switch (error.errorType) {
            case INVALID_APPLICATION_NUMBER:
            case APPLICATION_CHANGE_NOT_ELIGIBLE:
              snackBar.warn(`Not able to submit. ${error.message}`);
              break;
            case APPLICATION_HAS_PENDING_APPEAL:
              snackBar.error(`${error.message}`);
              break;
          }
        }
      } finally {
        processing.value = false;
      }
    };

    return {
      submitRequest,
      appealRequestsForms,
      showRequestForAppeal,
      backToRequestForm,
      submitAppeal,
      processing,
    };
  },
});
</script>
