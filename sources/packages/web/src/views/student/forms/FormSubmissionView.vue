<!-- Allow the student to see a submitted form. -->
<template>
  <student-page-container>
    <template #header>
      <header-navigator title="Student" sub-title="Forms submission" />
    </template>
    <body-header-container>
      <template #header>
        <body-header :title="formSubmission?.formCategory">
          <template #subtitle>
            Please see below the list of form(s) submitted in this request. If
            multiple are present, the process will be completed once all items
            have a final decision associated and the Ministry user mark it as
            completed.
          </template>
        </body-header>
      </template>
      <form-submission-items
        :submission-items="formSubmissionItems"
        :read-only="true"
      />
    </body-header-container>
  </student-page-container>
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect } from "vue";
import { useSnackBar } from "@/composables";
import FormSubmissionItems from "@/components/form-submissions/FormSubmissionItems.vue";
import { useRouter } from "vue-router";
import { FormSubmissionsService } from "@/services/FormSubmissionsService";
import { FormSubmissionItem, FormSubmissionItemApproval } from "@/types";
import { FormSubmissionStudentAPIOutDTO } from "@/services/http/dto";

export default defineComponent({
  components: {
    FormSubmissionItems,
  },
  props: {
    formDefinitionId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const snackBar = useSnackBar();
    const formSubmissionItems = ref([] as FormSubmissionItem[]);
    const processing = ref(false);
    const formSubmission = ref<FormSubmissionStudentAPIOutDTO>();

    watchEffect(async () => {
      // Submission data.
      formSubmission.value =
        await FormSubmissionsService.shared.getFormSubmission(
          props.formDefinitionId,
        );
      // Convert submission items to be displayed.
      formSubmissionItems.value =
        formSubmission.value.submissionItems.map<FormSubmissionItem>(
          (item) => ({
            dynamicConfigurationId: item.dynamicFormConfigurationId,
            category: item.formCategory,
            formType: item.formType,
            formName: item.formDefinitionName,
            formData: item.submissionData,
            approval: {
              status: item.decisionStatus,
            } as FormSubmissionItemApproval,
          }),
        );
    });

    return {
      formSubmissionItems,
      processing,
      formSubmission,
    };
  },
});
</script>
