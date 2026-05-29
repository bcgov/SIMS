<!-- Allow the student to submit a new form. -->
<template>
  <student-page-container>
    <template #header>
      <header-navigator
        title="Forms"
        :sub-title="referenceForm?.category"
        :route-location="backRouteLocation"
      />
      <form-submission-header-title
        :application-id="applicationId"
        :form-submission-items="formSubmissionItems"
      />
    </template>
    <body-header-container>
      <template #header>
        <body-header title="Complete all question(s) below">
          <template #subtitle>
            <p>
              <strong>Instructions:</strong>
            </p>
            <ul>
              <li>Complete all sections of the form.</li>
              <li>
                If you are resubmitting a form, you must include all relevant
                details and supporting documents from your previous submission,
                as any information not included will be overwritten and lost.
                <ul>
                  <li>
                    For application appeals: Resubmitting will replace your
                    previous submission. Any appeal items you do not include
                    again will be removed from assessment.
                  </li>
                </ul>
              </li>
              <li>
                Before submitting, ensure you have:
                <ul>
                  <li>Reviewed the criteria to confirm your eligibility.</li>
                  <li>Uploaded all required supporting documents.</li>
                </ul>
              </li>
              <li>
                Incorrect information or missing documentation may result in
                delays, or your submission not being considered.
              </li>
            </ul>
          </template>
        </body-header>
      </template>
      <content-group>
        <form-submission-items
          :submission-items="formSubmissionItems"
          :application-id="applicationId"
          :loading="loadingSubmissionForms"
          @submitted="submitted"
        >
          <template #actions="{ submit, allFormsLoaded }">
            <footer-buttons
              justify="space-between"
              :processing="processing"
              @secondary-click="cancel"
              secondary-label="Back"
              @primary-click="submit"
              primary-label="Submit for review"
              :disable-primary-button="!allFormsLoaded"
            ></footer-buttons>
          </template>
        </form-submission-items>
      </content-group>
    </body-header-container>
  </student-page-container>
</template>

<script setup lang="ts">
import { computed, PropType, ref, watchEffect } from "vue";
import {
  ApiProcessError,
  FormSubmissionItem,
  FormSubmissionItemSubmitted,
} from "@/types";
import { useSnackBar } from "@/composables";
import FormSubmissionHeaderTitle from "@/components/aest/students/FormSubmissionHeaderTitle.vue";
import FormSubmissionItems from "@/components/form-submissions/FormSubmissionItems.vue";
import { StudentRoutesConst } from "@/constants/routes/RouteConstants";
import { useRouter } from "vue-router";
import { FormSubmissionService } from "@/services/FormSubmissionService";
import { FORM_SUBMISSION_PENDING_DECISION } from "@/constants";

const props = defineProps({
  formDefinitionIds: {
    type: Array as PropType<number[]>,
    required: true,
  },
  applicationId: {
    type: Number,
    default: null,
    required: false,
  },
});
const router = useRouter();
const snackBar = useSnackBar();
const formSubmissionItems = ref([] as FormSubmissionItem[]);
const processing = ref(false);
const loadingSubmissionForms = ref(true);

const referenceForm = computed(() => formSubmissionItems.value[0]);

const submitted = async (items: FormSubmissionItemSubmitted[]) => {
  try {
    processing.value = true;
    await FormSubmissionService.shared.submitForm({
      applicationId: props.applicationId,
      items,
    });
    snackBar.success("The student form has been submitted successfully.");
    router.push({
      name: StudentRoutesConst.STUDENT_FORMS_HISTORY,
    });
  } catch (error: unknown) {
    if (error instanceof ApiProcessError) {
      if (error.errorType === FORM_SUBMISSION_PENDING_DECISION) {
        snackBar.warn(error.message);
        return;
      }
      snackBar.error(error.message);
      return;
    }
    snackBar.error("An unexpected error happened while submitting the form.");
  } finally {
    processing.value = false;
  }
};

watchEffect(async () => {
  try {
    loadingSubmissionForms.value = true;
    const formConfigurations =
      await FormSubmissionService.shared.getSubmissionForms();
    formSubmissionItems.value = props.formDefinitionIds.map<FormSubmissionItem>(
      (formDefinitionId) => {
        const formConfiguration = formConfigurations.configurations.find(
          (form) => form.id === formDefinitionId,
        );
        if (!formConfiguration) {
          snackBar.error(
            "An unexpected error occurred loading a form configuration.",
          );
          throw new Error("Invalid form configuration ID.");
        }
        return {
          dynamicConfigurationId: formConfiguration.id,
          formType: formConfiguration.formType,
          category: formConfiguration.formCategory,
          formName: formConfiguration.formDefinitionName,
          formData: {},
          files: [],
        };
      },
    );
  } catch {
    snackBar.error("An unexpected error happened while loading data.");
  } finally {
    loadingSubmissionForms.value = false;
  }
});

const backRouteLocation = computed(() => ({
  name: StudentRoutesConst.STUDENT_FORMS_SELECTOR,
  query: props.applicationId
    ? {
        applicationId: props.applicationId,
      }
    : undefined,
}));

const cancel = () => {
  router.push(backRouteLocation.value);
};
</script>
